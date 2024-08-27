const { User, UserProfile, Chat } = require('../../db/models');

class UserService {
  constructor(user, userProfile, chat) {
    this.user = user;
    this.userProfile = userProfile;
    this.chat = chat;
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

  getReceiverUsers(id) {
    console.log(id);
    
    return this.chat.findAll({
      where: { senderId: id },
      include: {
        model: this.user,
        as: 'receiver',
        attributes: ['id', 'name', 'email'], // Укажите нужные поля
      },
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

const userService = new UserService(User, UserProfile, Chat);

module.exports = userService;
