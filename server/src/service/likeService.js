const { Like, User, UserProfile } = require('../../db/models');

class LikeService {
  constructor(like, user, userProfile) {
    this.like = like;
    this.user = user;
    this.userProfile = userProfile;
  }

  async getLikesByAdvertId(advertId) {
    let likes = await this.like.findAll({
      where: { advertId },
      include: {
        model: User,
        include: {
          model: UserProfile,
        },
      },
    });
    likes = likes.map((el) => {
      const like = JSON.parse(JSON.stringify(el));
      delete like.User.hashpass;
      return like;
    });
    return likes;
  }

  async postLike(advertId, userId) {
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
        include: { model: this.userProfile },
      },
    });
    return { like, created };
  }

  async deleteLike(advertId, userId) {
    const count = await this.like.destroy({ where: { advertId, userId } });
    return { advertId: Number(advertId), deleted: count > 0 };
  }
}

const likeService = new LikeService(Like, User, UserProfile);

module.exports = likeService;
