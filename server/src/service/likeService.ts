import db = require('../../db/models');

const { Like, User, UserProfile } = db;

class LikeService {
  constructor(
    private readonly like: typeof db.Like,
    private readonly user: typeof db.User,
    private readonly userProfile: typeof db.UserProfile,
  ) {}

  async getLikesByListingId(listingId: string | number) {
    return this.like.findAll({
      where: { listingId },
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

  async postLike(listingId: string | number, userId: number) {
    const [newLike, created] = await this.like.findOrCreate({
      where: {
        listingId,
        userId,
      },
    });
    const like = await this.like.findByPk(newLike.get().id, {
      attributes: ['id', 'userId', 'listingId'],
      include: {
        model: this.user,
        attributes: ['id', 'name'],
        include: [{ model: this.userProfile }],
      },
    });
    return { like, created };
  }

  async deleteLike(listingId: string | number, userId: number) {
    const count = await this.like.destroy({ where: { listingId, userId } });
    return { listingId: Number(listingId), deleted: count > 0 };
  }
}

const likeService = new LikeService(Like, User, UserProfile);

export = likeService;
