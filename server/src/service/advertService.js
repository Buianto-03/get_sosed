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

  async addAdvert(formData) {
    const {
      title,
      body,
      price,
      floor,
      square,
      rooms,
      city,
      district,
      address,
      metro,
      userId,
      coordinates,
    } = formData;

    const advert = await this.advert.create({
      title,
      body,
      price,
      floor,
      square,
      rooms,
      userId,
    });
    await this.location.create({
      city,
      district,
      address,
      metro,
      coordinates,
      advertId: advert.id,
    });
    const advertWithUserAndLocation = await this.advert.findByPk(advert.id, {
      include: this.getReadIncludes(),
    });
    return advertWithUserAndLocation;
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

  async newAdvertPhotos(adverId, photo) {
    const newAdvertPhotos = await this.advertPhoto.create({
      photo: photo,
      advertId: adverId,
    });
    return newAdvertPhotos;
  }

  async getFilteredAdverts(filters) {
    const whereClause = {};
    const locationClause = {};
    const selectedTagIds = [...new Set((filters.tags || [])
      .map(({ id }) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0))];

    // console.log({ filters });

    if (filters.city) locationClause.city = filters.city;
    if (filters.district) locationClause.district = filters.district;
    if (filters.metro) locationClause.metro = filters.metro;

    if (filters.priceFrom || filters.priceTo) {
      whereClause.price = {};
      if (filters.priceFrom !== undefined) {
        whereClause.price[Op.gte] = Number(filters.priceFrom);
      }
      if (filters.priceTo && filters.priceTo !== 0) {
        whereClause.price[Op.lte] = Number(filters.priceTo);
      }
    }

    // if (filters.rooms) {
    //   whereClause.rooms = Number(filters.rooms);
    // }
    if(filters.roomsFrom || filters.roomsTo) {
      whereClause.rooms = {};
      if (filters.roomsFrom !== undefined) {
        whereClause.rooms[Op.gte] = Number(filters.roomsFrom);
      }
      if (filters.roomsTo && filters.roomsTo !== 0) {
        whereClause.rooms[Op.lte] = Number(filters.roomsTo);
      }
    }
    try {
      if (selectedTagIds.length > 0) {
        const matches = await this.advertTag.findAll({
          attributes: ['advertId'],
          where: { tagId: { [Op.in]: selectedTagIds } },
          group: ['advertId'],
          having: Sequelize.where(
            Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('tagId'))),
            selectedTagIds.length,
          ),
        });
        whereClause.id = { [Op.in]: matches.map(({ advertId }) => advertId) };
      }

      const adverts = await this.advert.findAll({
        where: whereClause,
        include: this.getReadIncludes(Object.keys(locationClause).length ? locationClause : undefined),
      });
      // console.log(JSON.stringify(adverts, null, 2));
      return adverts;
    } catch (error) {
      console.error('Ошибка при фильтрации объявлений:', error);
      throw error;
    }
  }

  async searchAdverts(filter) {
    try {
      const adverts = await this.advert.findAll({
        where: {
          name: {
            [Op.iLike]: `%${filter}%`,
          },
        },
        include: this.getReadIncludes(),
        order: [['name', 'ASC']],
      });
      return adverts;
    } catch (error) {
      console.error('Ошибка при поиске объявлений:', error);
      throw error;
    }
  }

  // getTagsLikeStr(str) {
  //   // where: { tagName: { [Op.like]: `%${str}%` } }
  // }

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
      const topAdverts = await Advert.findAll({
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
