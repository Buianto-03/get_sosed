import Sequelize = require('sequelize');
import db = require('../../db/models');

const { User, UserProfile, Chat } = db;

function selectLatestConversations(chats: InstanceType<typeof db.Chat>[]) {
  const seen = new Set<string>();
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
  constructor(
    private readonly user: typeof db.User,
    private readonly userProfile: typeof db.UserProfile,
    private readonly chat: typeof db.Chat,
  ) {}

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

  async getReceiverUsers(id: number) {
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

  async getSummary(id: number) {
    return this.user.findByPk(id, {
      attributes: ['id', 'name'],
      include: [{ model: this.userProfile, attributes: ['photo'] }],
    });
  }
}

const userService = new UserService(User, UserProfile, Chat);

export = userService;
