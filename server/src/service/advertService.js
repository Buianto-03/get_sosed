const { Advert } = require('../../db/models');

class AdvertService {
  constructor(model) {
    this.model = model;
  }

  // async addPost(formData) {
  //   const post = await this.model.create(formData);
  //   const postWithUser = await this.model.findByPk(post.id, {
  //     include: 'User',
  //   });
  //   return postWithUser;
  // }

  getAdverts() {
    return this.model.findAll({
      order: [['id', 'ASC']],
      include: ['User', 'Location'],
    });
  }

  //   async deletePost(id) {
  //     try {
  //       await this.model.destroy({ where: { id } });
  //       return true;
  //     } catch (error) {
  //       console.log(error);
  //       return false;
  //     }
  //   }

  //   async editPost(newData, id) {
  //     const post = await this.model.findByPk(id);
  //     await post.update(newData);
  //     const updatedPost = await this.model.findByPk(id, { include: 'User' });
  //     return updatedPost;
  //   }
}

const advertService = new AdvertService(Advert);

module.exports = advertService;
