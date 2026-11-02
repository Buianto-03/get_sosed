const { Op } = require('sequelize');
const { Chat, User, UserProfile } = require('../../db/models');

class ChatService {
  constructor(chat, user, userProfile) {
    this.chat = chat;
    this.user = user;
    this.userProfile = userProfile;
  }

  getReadIncludes() {
    return ['sender', 'receiver'].map((participant) => ({
      model: this.user,
      as: participant,
      attributes: ['id', 'name'],
      include: [{ model: this.userProfile, attributes: ['photo'] }],
    }));
  }

  async validateReceiver(userId, receiverId) {
    if (
      !Number.isSafeInteger(receiverId) ||
      receiverId <= 0 ||
      receiverId === userId
    ) {
      throw new Error('Invalid receiver');
    }
    if (!(await this.user.findByPk(receiverId, { attributes: ['id'] }))) {
      throw new Error('User not found');
    }
  }

  async getMessages(userId, receiverId) {
    await this.validateReceiver(userId, receiverId);
    return this.chat.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      },
      include: this.getReadIncludes(),
      order: [['id', 'ASC']],
    });
  }

  async sendMessage(userId, receiverId, text) {
    await this.validateReceiver(userId, receiverId);
    if (typeof text !== 'string' || !text.trim() || text.length > 10000) {
      throw new Error('Invalid message');
    }
    const created = await this.chat.create({
      senderId: userId,
      receiverId,
      message: text.trim(),
    });
    return this.chat.findByPk(created.id, { include: this.getReadIncludes() });
  }
}

module.exports = new ChatService(Chat, User, UserProfile);
