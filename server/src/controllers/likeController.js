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

  postLike = async (req, res) => {
    try {
      const { advertId } = req.params;
      const { userId } = req.body;
      const like = await this.service.createLike(advertId, userId);
      res.status(201).json(like);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

const likeController = new LikeController(likeService);

module.exports = likeController;
