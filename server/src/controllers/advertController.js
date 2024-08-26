const advertService = require('../service/advertService');

class AdvertController {
  constructor(service) {
    this.service = service;
  }

  getAdverts = (req, res) => {
    this.service.getAdverts().then((data) => res.json(data));
  };

  getAdvertById = async (req, res) => {
    const { advertId } = req.params;
    const advert = await this.service.getAdvertById(advertId);
    res.status(201).json(advert);
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

  //   patchPost = async (req, res) => {
  //     const { postId } = req.params;
  //     const updatedPost = await this.service.editPost(req.body, postId);
  //     res.json(updatedPost);
  //   };
  getFilteredAdverts = async (req, res) => {
    try {
      const filters = req.query; // Получаем фильтры из query-параметров запроса
      const filteredAdverts = await this.service.getFilteredAdverts(filters);
      res.json(filteredAdverts);
    } catch (error) {
      console.error('Ошибка при фильтрации объявлений:', error);
      res
        .status(500)
        .json({ error: 'Ошибка на сервере при фильтрации объявлений' });
    }
  };
}

const advertController = new AdvertController(advertService);

module.exports = advertController;
