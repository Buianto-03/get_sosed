const { Like, User, UserProfile } = require('../../db/models');

class LikeService {
  constructor(like, user) {
    (this.like = like), (this.user = user);
  }

  async getLikesByAdvertId(advertId) {
    const likes = await this.like.findAll({
      where: { advertId },
      include: {
        model: this.user,
        include: {
          model: UserProfile,
        },
      },
    });
    return likes;
  }
}

const likeService = new LikeService(Like, User);

module.exports = likeService;
