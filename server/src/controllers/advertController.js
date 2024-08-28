const advertService = require('../service/advertService');

class AdvertController {
  constructor(service) {
    this.service = service;
  }

  getAdverts = (req, res) => {
    this.service.getAdverts().then((data) => res.json(data));
  };

  getAdvertById = async (req, res) => {
    try {
      const { advertId } = req.params;
      const advert = await this.service.getAdvertById(advertId);
      console.log(advert);

      res.status(201).json(advert);
    } catch (error) {
      res.sendStatus(500);
    }
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
      // const filters = req.body;// post
      const filters = req.query; // get
      const filteredAdverts = await this.service.getFilteredAdverts(filters);
      res.json(filteredAdverts);
    } catch (error) {
      console.log('Ошибка при фильтрации объявлений:', error);
      res
        .status(500)
        .json({ error: 'Ошибка на сервере при фильтрации объявлений' });
    }
  };

  getTagsBySearch = async (req, res) => {
    // inputValue <- req.body/query
    try {
      const inputValue = req.query;
      const tags = await this.service.getTagsLikeStr(inputValue);
      res.json(tags);
    } catch (error) {
      console.log('Ломай меня полностью:', error);
      res.status(500).json({ error: 'Ошибка при поиске тегов' });
    }
  };

  likedAdvertsHandler = async (req, res) => {
    const { id } = res.locals.user;
    // const {id} = req.params
    console.log('res.locals ---->', res.locals);

    try {
      const likedAdverts = await this.service.likedAdverts(id);
      res.status(200).json(likedAdverts);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: 'Ошибка при получении избранных объявлений' });
    }
  };

  // searchAdverts = async (req, res) => {
  //   try {
  //     const { filter } = req.query;
  //     const searchAdverts = await this.service.searchAdverts(filter);
  //     res.json(searchAdverts);
  //   } catch (error) {
  //     console.error('Ошибка при поиске объявлений:', error);
  //     res
  //       .status(500)
  //       .json({ error: 'Ошибка на сервере при поиске объявлений' });
  //   }
  // };
  // get m
}

const advertController = new AdvertController(advertService);

module.exports = advertController;
