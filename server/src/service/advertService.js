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

  getAdverts() {
    return this.advert.findAll({
      order: [['id', 'ASC']],
      include: ['User', 'Location'],
    });
  }

    async deletePost(id) {
      try {
        await this.advert.destroy({ where: { id } });
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }

  //   async editPost(newData, id) {
  //     const post = await this.model.findByPk(id);
  //     await post.update(newData);
  //     const updatedPost = await this.model.findByPk(id, { include: 'User' });
  //     return updatedPost;
  //   }
}

const advertService = new AdvertService(Advert, Location);

module.exports = advertService;
