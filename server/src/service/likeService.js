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
    const like = newLike.get();

    if (created) {
      const likeWithProfile = await this.like.findByPk(like.id, {
        include: {
          model: this.user,
          include: {
            model: this.userProfile,
          },
        },
      });

      return likeWithProfile;
    } else {
      return;
    }
  }

  async deleteLike(advertId, userId) {
    console.log({ advertId, userId });
    const like = await this.like.findOne({
      where: {
        advertId,
        userId,
      },
    });
    // if (like) {
    //   await this.like.destroy();
    //   return like;
    // } else {
    //   return ;
    // }
    console.log({ like });
    await this.like.destroy({ where: { advertId, userId } });
    return like || {};
  }
}

const likeService = new LikeService(Like, User, UserProfile);

module.exports = likeService;
