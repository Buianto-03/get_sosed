import { Op } from 'sequelize';
import db = require('../../db/models');

const { Chat, User, UserProfile } = db;

class ChatService {
  constructor(
    private readonly chat: typeof db.Chat,
    private readonly user: typeof db.User,
    private readonly userProfile: typeof db.UserProfile,
  ) {}

  getReadIncludes() {
    return ['sender', 'receiver'].map((participant) => ({
      model: this.user,
      as: participant,
      attributes: ['id', 'name'],
      include: [{ model: this.userProfile, attributes: ['photo'] }],
    }));
  }

  async validateReceiver(userId: number, receiverId: number) {
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

  async getMessages(userId: number, receiverId: number) {
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

  async sendMessage(userId: number, receiverId: number, text: unknown) {
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

export = new ChatService(Chat, User, UserProfile);
