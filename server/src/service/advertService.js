const { Op } = require('sequelize');
const { Advert, Location } = require('../../db/models');

class AdvertService {
  constructor(advert, location) {
    this.advert = advert;
    this.location = location;
  }

  async addAdvert(formData) {
    const { city, district, address, metro, coordinates } = formData;
    const advert = await this.advert.create(formData);
    const location = await this.location.create({
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
  async getFilteredAdverts() {
    const { metro, city, district, priceFrom, priceTo } = req.query;
    try {
      const whereClause = {}; // Инициализация пустого объекта

      if (metro) whereClause.metro = metro; // Если есть параметр metro, добавляем его в whereClause
      if (city) whereClause.city = city; // Если есть параметр city, добавляем его в whereClause

      // Для диапазона цен используем операторы больше или равно (>=) и меньше или равно (<=)
      if (priceFrom || priceTo) {
        whereClause.price = {};
        if (priceFrom) whereClause.price[Op.gte] = Number(priceFrom); // price >= priceFrom
        if (priceTo) whereClause.price[Op.lte] = Number(priceTo); // price <= priceTo
      }

      // Теперь whereClause содержит все условия фильтрации, и мы можем использовать его в запросе
      const filteredAdverts = await Advert.findAll({
        where: whereClause,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'press F to pay respect' });
    }
  }
}

const advertService = new AdvertService(Advert, Location);

module.exports = advertService;
