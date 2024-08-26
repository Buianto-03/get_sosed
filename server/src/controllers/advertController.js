const advertService = require('../service/advertService');

class AdvertController {
  constructor(service) {
    this.service = service;
  }

  getAdverts = (req, res) => {
    this.service.getAdverts().then((data) => res.json(data));
  };

  createPost = async (req, res) => {
    try {
      const newPost = await this.service.addAdvert({
        ...req.body,
        userId: 1,
      });
      res.status(201).json(newPost);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  deletePost = async (req, res) => {
    const { postId } = req.params;
    const success = await this.service.deletePost(postId);
    res.sendStatus(success ? 204 : 500);
  };

  patchUser = async (req, res) => {
    const { userId } = req.params;
    const updatedUser = await this.service.editUser(req.body, userId);
    res.json(updatedUser);
  };
  getFilteredAdverts = async (req, res) => {
    try {
      const filters = req.query;
      const filteredAdverts = await advertService.getFilteredAdverts(filters);
      res.json(filteredAdverts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

const advertController = new AdvertController(advertService);

module.exports = advertController;
