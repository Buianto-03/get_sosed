const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const {
  Advert,
  Location,
  Tags,
  User,
  Like,
  AdvertPhoto,
  AdvertTag,
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
      include: ['User', 'Location'],
    });
    return advertWithUserAndLocation;
  }

  async getAdverts() {
    let adverts = await this.advert.findAll({
      order: [['id', 'ASC']],
      include: ['User', 'Location', 'AdvertPhotos'],
    });

    adverts = adverts.map((el) => {
      const advert = JSON.parse(JSON.stringify(el));
      delete advert.User.hashpass;
      return advert;
    });

    return adverts;
  }

  async getAdvertById(id) {
    console.log('id-----', id);

    const advert = await this.advert.findByPk(id, {
      include: ['User', 'Location', 'AdvertPhotos'],
    });
    return advert;
  }

  async likedAdverts(id) {
    console.log('id ------------->', id);

    const likedAdverts = await this.like.findAll({
      where: { userId: id },
      include: [
        {
          model: this.advert,
          include: ['User', 'Location'],
        },
      ],
    });
    // console.log(likedAdverts);

    return likedAdverts;
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
    // console.log(filters.tags.map((el) => el.id));

    // if (filters.tags) {
    //   whereClause.tags = {
    //     [Op.contains]: filters.tags.map((el) => el.id),
    //   };
    // }

    try {
      console.log({ whereClause });

      const adverts = await this.advert.findAll({
        // const adverts = await this.advertTag.findAll({
        where: whereClause,
        include: [
          {
            model: this.location,
            as: 'Location',
            where: locationClause, // Фильтрация по местоположению
          },
          'User',
          {
            model: this.tags, // Модель Tag
            where:
              filters.tags.length > 0
                ? {
                    [Op.and]: filters.tags.map(({ id }) => ({ id })),
                  }
                : undefined,
            as: 'tags',
            required: filters.tags.length > 0,
          },
          {
            model: this.advertPhoto,
            as: 'AdvertPhotos',
          },
        ], // подключить таблицу с тегами
      });
      // console.log(JSON.stringify(adverts, null, 2));
      console.log({ adverts });
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
        include: ['User', 'Location'],
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
        where: {
          name: {
            [Op.iLike]: `%${str}%`, // нужно сделать валидцию на регистр символа <--- str не строка
          },
        },
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
        include: [
          'Location',
          'User',
          { model: AdvertPhoto, as: 'AdvertPhotos' },
        ],
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
  AdvertTag,
);

module.exports = advertService;
