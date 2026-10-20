const fs = require('fs/promises');
const sharp = require('sharp');
const { Op } = require('sequelize');
const {
  sequelize,
  Advert,
  Location,
  Tags,
  AdvertTags,
  AdvertPhoto,
} = require('../../db/models');
const advertService = require('./advertService');
const invalid = (message) =>
  Object.assign(new Error(message), {
    status: 400,
    code: 'INVALID_ADVERT_DATA',
  });

class PublishAdvertService {
  constructor(
    sequelize,
    advert,
    location,
    tags,
    advertTags,
    advertPhoto,
    advertService,
  ) {
    this.sequelize = sequelize;
    this.advert = advert;
    this.location = location;
    this.tags = tags;
    this.advertTags = advertTags;
    this.advertPhoto = advertPhoto;
    this.advertService = advertService;
  }

  parseAdvert(body) {
    const result = {};
    for (const [field, max, required] of [
      ['title', 100, true],
      ['body', 10000, true],
      ['city', 100, true],
      ['address', 255, true],
      ['district', 100, false],
      ['metro', 100, false],
    ]) {
      const value = body[field] ?? '';
      if (
        typeof value !== 'string' ||
        value.trim().length > max ||
        (required && !value.trim())
      )
        throw invalid(`Invalid ${field}`);
      result[field] = value.trim() || null;
    }
    for (const field of ['price', 'square', 'rooms', 'floor']) {
      const value = Number(body[field]);
      if (!Number.isSafeInteger(value) || value <= 0 || value > 2147483647)
        throw invalid(`Invalid ${field}`);
      result[field] = value;
    }
    let tagIds;
    try {
      tagIds = JSON.parse(body.tagIds ?? '[]');
    } catch {
      throw invalid('Invalid tagIds');
    }
    if (
      !Array.isArray(tagIds) ||
      tagIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
    )
      throw invalid('Invalid tagIds');
    result.tagIds = [...new Set(tagIds)];
    const coordinates = body.coordinates || null;
    if (coordinates) {
      if (typeof coordinates !== 'string') throw invalid('Invalid coordinates');
      const parts = coordinates.split(',').map(Number);
      if (
        parts.length !== 2 ||
        parts.some((v) => !Number.isFinite(v)) ||
        Math.abs(parts[0]) > 90 ||
        Math.abs(parts[1]) > 180
      )
        throw invalid('Invalid coordinates');
    }
    result.coordinates = coordinates;
    return result;
  }

  async publishAdvert(body, files, userId) {
    const values = this.parseAdvert(body);
    if (!Array.isArray(files) || files.length < 1 || files.length > 10)
      throw invalid('Add 1–10 photos');
    const images = [];
    for (const file of files) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ||
        file.size > 10 * 1024 * 1024
      )
        throw invalid('Invalid photo');
      try {
        images.push(await sharp(file.buffer).webp().toBuffer());
      } catch {
        throw invalid('Cannot decode photo');
      }
    }
    let directory;
    try {
      return await this.sequelize.transaction(async (transaction) => {
        const tags = await this.tags.findAll({
          where: { id: { [Op.in]: values.tagIds } },
          transaction,
        });
        if (tags.length !== values.tagIds.length)
          throw invalid('Unknown tag ID');
        const {
          city,
          address,
          district,
          metro,
          coordinates,
          tagIds,
          ...fields
        } = values;
        const advert = await this.advert.create(
          { ...fields, userId },
          { transaction },
        );
        await this.location.create(
          { city, address, district, metro, coordinates, advertId: advert.id },
          { transaction },
        );
        if (tagIds.length)
          await this.advertTags.bulkCreate(
            tagIds.map((tagId) => ({ tagId, advertId: advert.id })),
            { transaction },
          );
        directory = `./public/images/adverts/advert-${advert.id}`;
        await fs.mkdir(directory, { recursive: true });
        for (let index = 0; index < images.length; index += 1) {
          const name = `photo-${index}.webp`;
          await fs.writeFile(`${directory}/${name}`, images[index]);
          await this.advertPhoto.create(
            {
              advertId: advert.id,
              photo: `/images/adverts/advert-${advert.id}/${name}`,
            },
            { transaction },
          );
        }
        return this.advert.findByPk(advert.id, {
          include: this.advertService.getReadIncludes(),
          transaction,
        });
      });
    } catch (error) {
      if (directory)
        await fs
          .rm(directory, { recursive: true, force: true })
          .catch((error) => {
            console.error('Cannot remove advert photos after rollback:', error);
          });
      throw error;
    }
  }
}

module.exports = new PublishAdvertService(
  sequelize,
  Advert,
  Location,
  Tags,
  AdvertTags,
  AdvertPhoto,
  advertService,
);
