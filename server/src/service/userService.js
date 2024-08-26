const { User, UserProfile } = require('../../db/models');

class UserService {
  constructor(user, userProfile) {
    this.user = user;
    this.userProfile = userProfile;
  }

  // async addPost(formData) {
  //   const post = await this.model.create(formData);
  //   const postWithUser = await this.model.findByPk(post.id, {
  //     include: 'User',
  //   });
  //   return postWithUser;
  // }

  getUsers() {
    return this.user.findAll({
      order: [['id', 'ASC']],
      include: 'UserProfile',
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

  async editUser(newData, id) {
    console.log('data --->', newData, 'id --->', id);

    const user = await this.userProfile.findOne({
      where: {
        userId: id,
      },
    });
    await user.update(newData);
    const updatedUser = await this.user.findByPk(id, {
      include: 'UserProfile',
    });
    return updatedUser;
  }
}

const userService = new UserService(User, UserProfile);

module.exports = userService;
