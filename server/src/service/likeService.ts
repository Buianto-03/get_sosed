import db = require('../../db/models');

const { Like, User, UserProfile } = db;

class LikeService {
  constructor(
    private readonly like: typeof db.Like,
    private readonly user: typeof db.User,
    private readonly userProfile: typeof db.UserProfile,
  ) {}

  async getLikesByAdvertId(advertId: string | number) {
    return this.like.findAll({
      where: { advertId },
      include: {
        model: this.user,
        attributes: { exclude: ['hashpass'] },
        include: [
          {
            model: this.userProfile,
          },
        ],
      },
    });
  }

  async postLike(advertId: string | number, userId: number) {
    const [newLike, created] = await this.like.findOrCreate({
      where: {
        advertId,
        userId,
      },
    });
    const like = await this.like.findByPk(newLike.get().id, {
      attributes: ['id', 'userId', 'advertId'],
      include: {
        model: this.user,
        attributes: ['id', 'name'],
        include: [{ model: this.userProfile }],
      },
    });
    return { like, created };
  }

  async deleteLike(advertId: string | number, userId: number) {
    const count = await this.like.destroy({ where: { advertId, userId } });
    return { advertId: Number(advertId), deleted: count > 0 };
  }
}

const likeService = new LikeService(Like, User, UserProfile);

export = likeService;
