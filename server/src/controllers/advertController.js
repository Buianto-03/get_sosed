const advertService = require('../service/advertService');
const publishAdvertService = require('../service/publishAdvertService');

class AdvertController {
  constructor(advertService, publishAdvertService) {
    this.advertService = advertService;
    this.publishAdvertService = publishAdvertService;
  }

  getAdverts = async (req, res) => {
    try {
      const adverts = await this.advertService.getAdverts();
      res.status(200).json(adverts);
    } catch (error) {
      console.error('Cannot read adverts:', error.message);
      res.status(500).json({ message: 'server error' });
    }
  };

  getAdvertById = async (req, res) => {
    try {
      const advertId = Number(req.params.advertId);
      if (!Number.isSafeInteger(advertId) || advertId <= 0) {
        return res.status(404).json({ message: 'Advert not found' });
      }
      const advert = await this.advertService.getAdvertById(advertId);
      if (!advert) {
        return res.status(404).json({ message: 'Advert not found' });
      }
      return res.status(200).json(advert);
    } catch (error) {
      return res.status(500).json({ message: 'server error' });
    }
  };

  getMine = async (req, res) => {
    try {
      return res.json(await this.advertService.getMine(res.locals.user.id, req.query));
    } catch (error) {
      if (error.status === 400 && error.code === 'INVALID_PAGINATION') {
        return res.status(400).json({ code: error.code, message: error.message });
      }
      console.error('Cannot load own adverts:', error);
      return res.status(500).json({
        code: 'OWN_ADVERTS_LOAD_FAILED',
        message: 'Cannot load own adverts',
      });
    }
  };

  createAdvert = async (req, res) => {
    try {
      return res
        .status(201)
        .json(
          await this.publishAdvertService.publishAdvert(
            req.body,
            req.files,
            res.locals.user.id,
          ),
        );
    } catch (error) {
      const isExpectedError = error.status === 400 && error.code === 'INVALID_ADVERT_DATA';
      const status = isExpectedError || (error.status >= 500 && error.status < 600)
        ? error.status
        : 500;
      if (!isExpectedError) {
        console.error('Cannot publish advert:', error);
      }
      return res
        .status(status)
        .json({
          code: isExpectedError ? error.code : 'ADVERT_PUBLISH_FAILED',
          message: isExpectedError ? error.message : 'Cannot publish advert',
        });
    }
  };

  deletePost = async (req, res) => {
    const { postId } = req.params;
    const success = await this.advertService.deletePost(postId);
    res.sendStatus(success ? 204 : 500);
  };

  getFilteredAdverts = async (req, res) => {
    try {
      const filters = req.body;
      const filteredAdverts = await this.advertService.getFilteredAdverts(filters);
      res.json(filteredAdverts);
    } catch (error) {
      console.log('Ошибка при фильтрации объявлений:', error);
      res
        .status(500)
        .json({ error: 'Ошибка на сервере при фильтрации объявлений' });
    }
  };

  getTagsBySearch = async (req, res) => {
    const query = req.query.query ?? '';
    if (typeof query !== 'string') {
      return res.status(400).json({ error: 'query must be a string' });
    }
    try {
      const tags = await this.advertService.getTagsLikeStr(query.trim());
      return res.status(200).json(tags);
    } catch (error) {
      return res.status(500).json({ error: 'Ошибка при поиске тегов' });
    }
  };

  likedAdvertsHandler = async (req, res) => {
    const { id } = res.locals.user;

    try {
      const likedAdverts = await this.advertService.likedAdverts(id);
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
      const topAdverts = await this.advertService.getTopAdvertsByLikes();
      res.status(200).json(topAdverts);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка при получении топ-объявлений' });
    }
  };
}

const advertController = new AdvertController(advertService, publishAdvertService);

module.exports = advertController;
