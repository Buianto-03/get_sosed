const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const {
  Advert,
  Location,
  Tags,
  User,
  Like,
  AdvertPhoto,
  AdvertTags,
} = require('../../db/models');

function invalidPagination() {
  return Object.assign(new Error('Invalid pagination parameters'), {
    status: 400,
    code: 'INVALID_PAGINATION',
  });
}

function parsePageValue(value) {
  if (
    !['string', 'number'].includes(typeof value) ||
    !/^[1-9]\d*$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value))
  ) {
    throw invalidPagination();
  }
  return Number(value);
}

class AdvertService {
  constructor(advert, location, tags, user, like, advertPhoto, advertTag) {
    this.advert = advert;
    this.location = location;
    this.tags = tags;
    this.user = user;
    this.like = like;
    this.advertPhoto = advertPhoto;
    this.advertTag = advertTag;
  }

  getReadIncludes(locationWhere) {
    return [
      { model: this.user, as: 'user', attributes: ['id', 'name', 'email'] },
      {
        model: this.location,
        as: 'location',
        ...(locationWhere ? { where: locationWhere } : {}),
      },
      {
        model: this.advertPhoto,
        as: 'AdvertPhotos',
        separate: true,
        order: [['id', 'ASC']],
      },
      {
        model: this.tags,
        as: 'tags',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        required: false,
      },
    ];
  }

  async getMine(userId, { page = 1, limit = 12 } = {}) {
    const currentPage = parsePageValue(page);
    const pageSize = parsePageValue(limit);
    const offset = (currentPage - 1) * pageSize;
    if (pageSize > 50 || !Number.isSafeInteger(offset)) {
      throw invalidPagination();
    }
    const { rows, count } = await this.advert.findAndCountAll({
      where: { userId },
      limit: pageSize,
      offset,
      distinct: true,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      include: this.getReadIncludes(),
    });
    return { items: rows, total: count, page: currentPage, limit: pageSize };
  }

  async getAdverts() {
    return this.advert.findAll({
      order: [['id', 'ASC']],
      include: this.getReadIncludes(),
    });
  }

  async getAdvertById(id) {
    return this.advert.findByPk(id, {
      include: this.getReadIncludes(),
    });
  }

  async likedAdverts(id) {
    return this.like.findAll({
      where: { userId: id },
      include: [{ model: this.advert, include: this.getReadIncludes() }],
    });
  }

  getSelectedTagIds(tags) {
    return [
      ...new Set(
        (tags || [])
          .map(({ id }) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];
  }

  getLocationWhere(filters) {
    const locationClause = {};
    if (filters.city) {
      locationClause.city = filters.city;
    }
    if (filters.district) {
      locationClause.district = filters.district;
    }
    if (filters.metro) {
      locationClause.metro = filters.metro;
    }
    return locationClause;
  }

  getAdvertWhere(filters) {
    const whereClause = {};
    if (filters.priceFrom || filters.priceTo) {
      whereClause.price = {};
      if (filters.priceFrom !== undefined) {
        whereClause.price[Op.gte] = Number(filters.priceFrom);
      }
      if (filters.priceTo && filters.priceTo !== 0) {
        whereClause.price[Op.lte] = Number(filters.priceTo);
      }
    }

    if (filters.roomsFrom || filters.roomsTo) {
      whereClause.rooms = {};
      if (filters.roomsFrom !== undefined) {
        whereClause.rooms[Op.gte] = Number(filters.roomsFrom);
      }
      if (filters.roomsTo && filters.roomsTo !== 0) {
        whereClause.rooms[Op.lte] = Number(filters.roomsTo);
      }
    }
    return whereClause;
  }

  async getAdvertIdsByTags(tagIds) {
    const matches = await this.advertTag.findAll({
      attributes: ['advertId'],
      where: { tagId: { [Op.in]: tagIds } },
      group: ['advertId'],
      having: Sequelize.where(
        Sequelize.fn(
          'COUNT',
          Sequelize.fn('DISTINCT', Sequelize.col('tagId')),
        ),
        tagIds.length,
      ),
    });
    return matches.map(({ advertId }) => advertId);
  }

  async getFilteredAdverts(filters) {
    const selectedTagIds = this.getSelectedTagIds(filters.tags);
    const locationClause = this.getLocationWhere(filters);
    const whereClause = this.getAdvertWhere(filters);
    try {
      if (selectedTagIds.length > 0) {
        const advertIds = await this.getAdvertIdsByTags(selectedTagIds);
        whereClause.id = { [Op.in]: advertIds };
      }

      const adverts = await this.advert.findAll({
        where: whereClause,
        include: this.getReadIncludes(
          Object.keys(locationClause).length ? locationClause : undefined,
        ),
      });
      return adverts;
    } catch (error) {
      console.error('Ошибка при фильтрации объявлений:', error);
      throw error;
    }
  }

  async getTagsLikeStr(str) {
    try {
      const tags = await this.tags.findAll({
        attributes: ['id', 'name'],
        where: str ? { name: { [Op.iLike]: `%${str}%` } } : {},
        order: [['id', 'ASC']],
      });
      return tags;
    } catch (error) {
      console.error('Ошибка при поиске тегов:', error);
      throw error;
    }
  }

  async getTopAdvertsByLikes() {
    try {
      const topAdverts = await this.advert.findAll({
        attributes: [
          'id',
          'title',
          'body',
          'price',
          'floor',
          'square',
          'rooms',
          'userId',
          'createdAt',
          'updatedAt',
          [
            Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Likes"
            WHERE "Likes"."advertId" = "Advert"."id"
          )`),
            'likeCount',
          ],
        ],
        order: [[Sequelize.literal('"likeCount"'), 'DESC']],
        limit: 4,
        include: this.getReadIncludes(),
      });
      return topAdverts;
    } catch (error) {
      console.error('Error fetching top adverts by likes:', error);
      throw error;
    }
  }
}

const advertService = new AdvertService(
  Advert,
  Location,
  Tags,
  User,
  Like,
  AdvertPhoto,
  AdvertTags,
);

module.exports = advertService;
