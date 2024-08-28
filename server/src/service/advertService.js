const { Op } = require('sequelize');
const { Advert, Location } = require('../../db/models');

class AdvertService {
  constructor(advert, location) {
    this.advert = advert;
    this.location = location;
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
      include: ['User', 'Location'],
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
      include: ['User', 'Location'],
    });
    return advert;
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
}

const advertService = new AdvertService(Advert, Location);

module.exports = advertService;
