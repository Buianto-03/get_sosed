import type { Transaction } from 'sequelize';
import { Op } from 'sequelize';
import fs = require('fs/promises');
import sharp = require('sharp');

import db = require('../../db/models');
import readAdvertService = require('./advertService');
import AppError = require('../utils/appError');

const { sequelize, Advert, Location, Tags, AdvertTags, AdvertPhoto } = db;
const MAX_POSTGRES_INTEGER = 2 ** 31 - 1;

interface AdvertValues {
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
  new AppError(400, 'INVALID_ADVERT_DATA', message);

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

class PublishAdvertService {
  constructor(
    private readonly sequelize: typeof db.sequelize,
    private readonly advert: typeof db.Advert,
    private readonly location: typeof db.Location,
    private readonly tags: typeof db.Tags,
    private readonly advertTags: typeof db.AdvertTags,
    private readonly advertPhoto: typeof db.AdvertPhoto,
    private readonly advertService: typeof readAdvertService,
  ) {}

  parseAdvert(body: Record<string, unknown>): AdvertValues {
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

  async createAdvertWithRelations(
    values: AdvertValues,
    userId: number,
    transaction: Transaction,
  ) {
    const { city, address, district, metro, coordinates, tagIds, ...fields } =
      values;
    const advert = await this.advert.create(
      { ...fields, userId },
      { transaction },
    );
    await this.location.create(
      { city, address, district, metro, coordinates, advertId: advert.id },
      { transaction },
    );
    if (tagIds.length) {
      await this.advertTags.bulkCreate(
        tagIds.map((tagId) => ({ tagId, advertId: advert.id })),
        { transaction },
      );
    }
    return advert;
  }

  getPublishedAdvert(advertId: number, transaction: Transaction) {
    return this.advert.findByPk(advertId, {
      include: this.advertService.getReadIncludes(),
      transaction,
    });
  }

  createPhotoPaths(advertId: number, index: number) {
    const directory = `./public/images/adverts/advert-${advertId}`;
    const fileName = `photo-${index}.webp`;
    return {
      directory,
      filePath: `${directory}/${fileName}`,
      url: `/images/adverts/advert-${advertId}/${fileName}`,
    };
  }

  async saveAdvertPhotos(
    advertId: number,
    images: Buffer[],
    directory: string,
    transaction: Transaction,
  ) {
    await fs.mkdir(directory, { recursive: true });
    for (let index = 0; index < images.length; index += 1) {
      const photo = this.createPhotoPaths(advertId, index);
      await fs.writeFile(photo.filePath, images[index]);
      await this.advertPhoto.create(
        { advertId, photo: photo.url },
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
      console.error('Cannot remove advert photos after rollback:', error);
    }
  }

  async publishAdvert(
    body: Record<string, unknown>,
    files: Express.Multer.File[] | undefined,
    userId: number,
  ) {
    const values = this.parseAdvert(body);
    const images = await this.preparePhotos(files);
    let directory: string | undefined;
    try {
      return await this.sequelize.transaction(async (transaction) => {
        await this.validateTagIds(values.tagIds, transaction);
        const advert = await this.createAdvertWithRelations(
          values,
          userId,
          transaction,
        );
        directory = this.createPhotoPaths(advert.id, 0).directory;
        await this.saveAdvertPhotos(advert.id, images, directory, transaction);
        return this.getPublishedAdvert(advert.id, transaction);
      });
    } catch (error) {
      await this.removeCreatedPhotos(directory);
      throw error;
    }
  }
}

export = new PublishAdvertService(
  sequelize,
  Advert,
  Location,
  Tags,
  AdvertTags,
  AdvertPhoto,
  readAdvertService,
);
