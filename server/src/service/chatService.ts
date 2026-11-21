import { Op } from 'sequelize';
import db = require('../../db/models');

const { Chat, User, UserProfile } = db;

const DEFAULT_HISTORY_PAGE_SIZE = 50;
const MAX_HISTORY_PAGE_SIZE = 100;

interface ChatHistoryOptions {
  limit?: unknown;
  beforeId?: unknown;
  afterId?: unknown;
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const getConversationWhere = (userId: number, receiverId: number) => ({
  [Op.or]: [
    { senderId: userId, receiverId },
    { senderId: receiverId, receiverId: userId },
  ],
});

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
    if (!isPositiveInteger(receiverId) || receiverId === userId) {
      throw new Error('Invalid receiver');
    }
    if (!(await this.user.findByPk(receiverId, { attributes: ['id'] }))) {
      throw new Error('User not found');
    }
  }

  async getMessages(userId: number, receiverId: number) {
    await this.validateReceiver(userId, receiverId);
    return this.chat.findAll({
      where: getConversationWhere(userId, receiverId),
      include: this.getReadIncludes(),
      order: [['id', 'ASC']],
    });
  }

  async getHistoryPage(
    userId: number,
    receiverId: number,
    { limit = DEFAULT_HISTORY_PAGE_SIZE, beforeId, afterId }: ChatHistoryOptions,
  ) {
    if (!isPositiveInteger(limit) || limit > MAX_HISTORY_PAGE_SIZE) {
      throw new Error('Invalid history page limit');
    }
    if (
      (beforeId !== undefined && !isPositiveInteger(beforeId)) ||
      (afterId !== undefined && afterId !== 0 && !isPositiveInteger(afterId)) ||
      (beforeId !== undefined && afterId !== undefined)
    ) {
      throw new Error('Invalid history page cursor');
    }
    await this.validateReceiver(userId, receiverId);

    const cursorId = afterId ?? beforeId;
    const isForward = afterId !== undefined;
    const cursorOperator = isForward ? Op.gt : Op.lt;
    const rows = await this.chat.findAll({
      where: {
        ...getConversationWhere(userId, receiverId),
        ...(cursorId === undefined ? {} : { id: { [cursorOperator]: cursorId } }),
      },
      attributes: ['id', 'senderId', 'receiverId', 'message', 'createdAt', 'updatedAt'],
      include: this.getReadIncludes(),
      order: [['id', isForward ? 'ASC' : 'DESC']],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit);
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;
    if (!isForward) {
      messages.reverse();
    }
    return { messages, hasMore, nextCursor };
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
