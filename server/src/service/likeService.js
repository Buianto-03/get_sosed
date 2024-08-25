const { Like, User, UserProfile } = require('../../db/models');

class LikeService {
  constructor(like) {
    this.like = like;
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
    const like = await this.like.create({
      advertId,
      userId,
    });
    return like;
  }
}

const likeService = new LikeService(Like, User);

module.exports = likeService;
