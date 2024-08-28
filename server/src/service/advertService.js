const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const {
  Advert,
  Location,
  Tags,
  User,
  Like,
  AdvertPhoto,
} = require('../../db/models');

class AdvertService {
  constructor(advert, location, tags, user, like, advertPhoto) {
    this.advert = advert;
    this.location = location;
    this.tags = tags;
    this.user = user;
    this.like = like;
    this.advertPhoto = advertPhoto;
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
    return newAdvertPhotos
  }

  // async deletePost(id) {
  //   try {
  //     await this.advert.destroy({ where: { id } });
  //     return true;
  //   } catch (error) {
  //     console.log(error);
  //     return false;
  //   }
  // }
  //   async editPost(newData, id) {
  //     const post = await this.model.findByPk(id);
  //     await post.update(newData);
  //     const updatedPost = await this.model.findByPk(id, { include: 'User' });
  //     return updatedPost;
  //   }
  async getFilteredAdverts(filters) {
    const whereClause = {};
    const locationClause = {};

    if (filters.city) locationClause.city = filters.city;
    if (filters.district) locationClause.district = filters.district;
    if (filters.metro) locationClause.metro = filters.metro;

    if (filters.priceFrom || filters.priceTo) {
      whereClause.price = {};
      if (filters.priceFrom)
        whereClause.price[Op.gte] = Number(filters.priceFrom);
      if (filters.priceTo) whereClause.price[Op.lte] = Number(filters.priceTo);
    }

    if (filters.rooms) {
      whereClause.rooms = Number(filters.rooms);
    }

    try {
      const adverts = await this.advert.findAll({
        where: whereClause,
        include: [
          {
            model: this.location,
            as: 'Location',
            where: locationClause, // Фильтрация по местоположению
          },
          'User',
        ],
      });
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
    console.log(str); // приходит объект
    try {
      const tags = await this.tags.findAll({
        where: {
          name: {
            [Op.iLike]: `%${str.query}%`, // нужно сделать валидцию на регистр символа <--- str не строка
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
);

module.exports = advertService;
