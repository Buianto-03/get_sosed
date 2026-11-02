const { User, UserProfile, Chat } = require('../../db/models');
const Sequelize = require('sequelize');

function selectLatestConversations(chats) {
  const seen = new Set();
  return chats.filter((chat) => {
    const chatKey = `${chat.senderId}-${chat.receiverId}`;
    const reverseChatKey = `${chat.receiverId}-${chat.senderId}`;
    const isDuplicate = seen.has(chatKey) || seen.has(reverseChatKey);
    seen.add(chatKey);
    seen.add(reverseChatKey);
    return !isDuplicate;
  });
}

class UserService {
  constructor(user, userProfile, chat) {
    this.user = user;
    this.userProfile = userProfile;
    this.chat = chat;
  }

  getUsers() {
    return this.user.findAll({
      order: [['id', 'ASC']],
      attributes: { exclude: ['hashpass'] },
      include: 'UserProfile',
    });
  }

  getConversationIncludes() {
    return ['receiver', 'sender'].map((participant) => ({
      model: this.user,
      as: participant,
      attributes: ['id', 'name', 'email'],
      include: [{ model: this.userProfile, attributes: ['photo'] }],
    }));
  }

  async getReceiverUsers(id) {
    const allChats = await this.chat.findAll({
      where: {
        [Sequelize.Op.or]: [{ senderId: id }, { receiverId: id }],
      },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      include: this.getConversationIncludes(),
    });

    return selectLatestConversations(allChats);
  }

  async getSummary(id) {
    return this.user.findByPk(id, {
      attributes: ['id', 'name'],
      include: [{ model: this.userProfile, attributes: ['photo'] }],
    });
  }
}

const userService = new UserService(User, UserProfile, Chat);

module.exports = userService;
