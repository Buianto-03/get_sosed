const likeService = require('../service/likeService');

class LikeController {
  constructor(service) {
    this.service = service;
  }

  getLikes = async (req, res) => {
    try {
      const { advertId } = req.params;
      const likes = await this.service.getLikesByAdvertId(advertId);
      res.status(200).json(likes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  setLike = async (req, res) => {
    try {
      const { advertId } = req.params;
      const userId = res.locals.user.id;
      const like = await this.service.postLike(advertId, userId);
      return res.status(201).json(like);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  deleteLike = async (req, res) => {
    try {
      const { advertId } = req.params;
      const userId = res.locals.user.id;
      const like = await this.service.deleteLike(advertId, userId);
      res.status(200).json(like);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

const likeController = new LikeController(likeService);

module.exports = likeController;
