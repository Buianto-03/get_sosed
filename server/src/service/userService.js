const { User, UserProfile, Chat } = require('../../db/models');
const Sequelize = require('sequelize');

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

  async getReceiverUsers(id) {
    const allChats = await this.chat.findAll({
      where: {
        [Sequelize.Op.or]: [{ senderId: id }, { receiverId: id }],
      },
      include: [
        {
          model: this.user,
          as: 'receiver',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: this.user,
          as: 'sender',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    const seen = new Set();
    const uniqueChats = allChats.filter((chat) => {
      const chatKey = `${chat.senderId}-${chat.receiverId}`;
      const reverseChatKey = `${chat.receiverId}-${chat.senderId}`;
      const isDuplicate = seen.has(chatKey) || seen.has(reverseChatKey);
      seen.add(chatKey);
      seen.add(reverseChatKey);
      return !isDuplicate;
    });

    return uniqueChats;
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
    // console.log('data --->', newData, 'id --->', id);

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
