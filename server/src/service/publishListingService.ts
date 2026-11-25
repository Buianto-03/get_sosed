import type { Transaction } from 'sequelize';
import { Op } from 'sequelize';
import fs = require('fs/promises');
import sharp = require('sharp');

import db = require('../../db/models');
import readListingService = require('./listingService');
import AppError = require('../utils/appError');

const { sequelize, Listing, Location, Tags, ListingTags, ListingPhoto } = db;
const MAX_POSTGRES_INTEGER = 2 ** 31 - 1;

interface ListingValues {
  title: string;
  body: string;
  city: string;
  address: string;
  district: string | null;
  metro: string | null;
  price: number;
  square: number;
  rooms: number;
  floor: number;
  tagIds: number[];
  coordinates: string | null;
}

const invalid = (message: string) =>
  new AppError(400, 'INVALID_LISTING_DATA', message);

function parseText(
  value: unknown,
  field: string,
  maxLength: number,
  required: boolean,
): string {
  const text = value ?? '';
  if (
    typeof text !== 'string' ||
    text.trim().length > maxLength ||
    (required && !text.trim())
  ) {
    throw invalid(`Invalid ${field}`);
  }
  return text.trim();
}

function parsePositiveInteger(value: unknown, field: string): number {
  const number = Number(value);
  if (
    !Number.isSafeInteger(number) ||
    number <= 0 ||
    number > MAX_POSTGRES_INTEGER
  ) {
    throw invalid(`Invalid ${field}`);
  }
  return number;
}

class PublishListingService {
  constructor(
    private readonly sequelize: typeof db.sequelize,
    private readonly listing: typeof db.Listing,
    private readonly location: typeof db.Location,
    private readonly tags: typeof db.Tags,
    private readonly listingTags: typeof db.ListingTags,
    private readonly listingPhoto: typeof db.ListingPhoto,
    private readonly listingService: typeof readListingService,
  ) {}

  parseListing(body: Record<string, unknown>): ListingValues {
    const title = parseText(body.title, 'title', 100, true);
    const description = parseText(body.body, 'body', 10000, true);
    const city = parseText(body.city, 'city', 100, true);
    const address = parseText(body.address, 'address', 255, true);
    const district = parseText(body.district, 'district', 100, false) || null;
    const metro = parseText(body.metro, 'metro', 100, false) || null;
    const price = parsePositiveInteger(body.price, 'price');
    const square = parsePositiveInteger(body.square, 'square');
    const rooms = parsePositiveInteger(body.rooms, 'rooms');
    const floor = parsePositiveInteger(body.floor, 'floor');

    let tagIds: unknown;

    try {
      tagIds = JSON.parse(String(body.tagIds ?? '[]'));
    } catch {
      throw invalid('Invalid tagIds');
    }

    if (
      !Array.isArray(tagIds) ||
      !tagIds.every(
        (id: unknown): id is number =>
          typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
      )
    ) {
      throw invalid('Invalid tagIds');
    }

    const coordinates = body.coordinates || null;

    if (coordinates !== null && typeof coordinates !== 'string') {
      throw invalid('Invalid coordinates');
    }
    if (coordinates) {
      const parts = coordinates.split(',').map(Number);
      if (
        parts.length !== 2 ||
        parts.some((v) => !Number.isFinite(v)) ||
        Math.abs(parts[0]) > 90 ||
        Math.abs(parts[1]) > 180
      ) {
        throw invalid('Invalid coordinates');
      }
    }

    return {
      title,
      body: description,
      city,
      address,
      district,
      metro,
      price,
      square,
      rooms,
      floor,
      tagIds: [...new Set(tagIds)],
      coordinates,
    };
  }

  async preparePhotos(files: Express.Multer.File[] | undefined) {
    if (!Array.isArray(files) || files.length < 1 || files.length > 10) {
      throw invalid('Add 1–10 photos');
    }
    const images = [];
    for (const file of files) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ||
        file.size > 10 * 1024 * 1024
      ) {
        throw invalid('Invalid photo');
      }
      try {
        images.push(await sharp(file.buffer).webp().toBuffer());
      } catch {
        throw invalid('Cannot decode photo');
      }
    }
    return images;
  }

  async validateTagIds(tagIds: number[], transaction: Transaction) {
    const tags = await this.tags.findAll({
      where: { id: { [Op.in]: tagIds } },
      transaction,
    });
    if (tags.length !== tagIds.length) {
      throw invalid('Unknown tag ID');
    }
  }

  async createListingWithRelations(
    values: ListingValues,
    userId: number,
    transaction: Transaction,
  ) {
    const { city, address, district, metro, coordinates, tagIds, ...fields } =
      values;
    const listing = await this.listing.create(
      { ...fields, userId },
      { transaction },
    );
    await this.location.create(
      { city, address, district, metro, coordinates, listingId: listing.id },
      { transaction },
    );
    if (tagIds.length) {
      await this.listingTags.bulkCreate(
        tagIds.map((tagId) => ({ tagId, listingId: listing.id })),
        { transaction },
      );
    }
    return listing;
  }

  getPublishedListing(listingId: number, transaction: Transaction) {
    return this.listing.findByPk(listingId, {
      include: this.listingService.getReadIncludes(),
      transaction,
    });
  }

  createPhotoPaths(listingId: number, index: number) {
    const directory = `./public/images/listings/listing-${listingId}`;
    const fileName = `photo-${index}.webp`;
    return {
      directory,
      filePath: `${directory}/${fileName}`,
      url: `/images/listings/listing-${listingId}/${fileName}`,
    };
  }

  async saveListingPhotos(
    listingId: number,
    images: Buffer[],
    directory: string,
    transaction: Transaction,
  ) {
    await fs.mkdir(directory, { recursive: true });
    for (let index = 0; index < images.length; index += 1) {
      const photo = this.createPhotoPaths(listingId, index);
      await fs.writeFile(photo.filePath, images[index]);
      await this.listingPhoto.create(
        { listingId, photo: photo.url },
        { transaction },
      );
    }
  }

  async removeCreatedPhotos(directory: string | undefined) {
    if (!directory) {
      return;
    }
    try {
      await fs.rm(directory, { recursive: true, force: true });
    } catch (error) {
      console.error('Cannot remove listing photos after rollback:', error);
    }
  }

  async publishListing(
    body: Record<string, unknown>,
    files: Express.Multer.File[] | undefined,
    userId: number,
  ) {
    const values = this.parseListing(body);
    const images = await this.preparePhotos(files);
    let directory: string | undefined;
    try {
      return await this.sequelize.transaction(async (transaction) => {
        await this.validateTagIds(values.tagIds, transaction);
        const listing = await this.createListingWithRelations(
          values,
          userId,
          transaction,
        );
        directory = this.createPhotoPaths(listing.id, 0).directory;
        await this.saveListingPhotos(listing.id, images, directory, transaction);
        return this.getPublishedListing(listing.id, transaction);
      });
    } catch (error) {
      await this.removeCreatedPhotos(directory);
      throw error;
    }
  }
}

export = new PublishListingService(
  sequelize,
  Listing,
  Location,
  Tags,
  ListingTags,
  ListingPhoto,
  readListingService,
);
