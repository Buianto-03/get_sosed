const advertService = require('../service/advertService');
const sharp = require('sharp');
const fs = require('fs/promises');
const { log } = require('console');

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
      // console.log(advertId);
      const advert = await this.service.getAdvertById(advertId);

      res.status(201).json(advert);
    } catch (error) {
      res.sendStatus(500);
    }
  };

  createAdvert = async (req, res) => {
    try {
      const newAdvert = await this.service.addAdvert({
        ...req.body,
        userId: res.locals.user.id,
      });

      if (!req.files.length) {
        return res.status(400).json({ message: 'File not found' });
      }

      await fs.mkdir(`./public/images/adverts/advert-${newAdvert.id}`);
      req.files.forEach(async (file, i) => {
        const name = `advert${newAdvert.id}-${i}.webp`;
        const outputBuffer = await sharp(file.buffer).webp().toBuffer();
        await fs.writeFile(
          `./public/images/adverts/advert-${newAdvert.id}/${name}`,
          outputBuffer,
        );
        await this.service.newAdvertPhotos(newAdvert.id, `/images/adverts/advert-${newAdvert.id}/${name}`)
      });

      res.status(201).json(newAdvert);
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
  // console.log(req.body);
  
    try {
      const filters = req.body;// post (есть свойство tags)
      // console.log(filters.tags);
      // const filters = req.query; // get (есть свойство tags)
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
    console.log(req.query);
    
    try {
      const inputValue = req.query.query;
      const tags = await this.service.getTagsLikeStr(inputValue);
      res.json(tags);
    } catch (error) {
      console.log('Ломай меня полностью:', error);
      res.status(500).json({ error: 'Ошибка при поиске тегов' });
    }
  };

  likedAdvertsHandler = async (req, res) => {
    const { id } = res.locals.user;

    try {
      const likedAdverts = await this.service.likedAdverts(id);
      // console.log(JSON.parse(JSON.stringify(likedAdverts)));

      res.status(200).json(likedAdverts);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: 'Ошибка при получении избранных объявлений' });
    }
  };

  getTopAdvertsByLikes = async (req, res) => {
    try {
      const topAdverts = await this.service.getTopAdvertsByLikes();
      res.status(200).json(topAdverts);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Ошибка при получении топ-объявлений' });
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
