import type { Request, Response } from 'express';

import advertServiceInstance = require('../service/advertService');
import publishAdvertServiceInstance = require('../service/publishAdvertService');

interface ErrorDetails {
  status?: number;
  code?: string;
  message?: string;
}

function errorDetails(error: unknown): ErrorDetails {
  return typeof error === 'object' && error !== null ? error : {};
}

class AdvertController {
  constructor(
    private readonly advertService: typeof advertServiceInstance,
    private readonly publishAdvertService: typeof publishAdvertServiceInstance,
  ) {}

  getAdverts = async (req: Request, res: Response) => {
    try {
      const adverts = await this.advertService.getAdverts();
      res.status(200).json(adverts);
    } catch (error) {
      console.error('Cannot read adverts:', errorDetails(error).message);
      res.status(500).json({ message: 'server error' });
    }
  };

  getAdvertById = async (req: Request, res: Response) => {
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

  getMine = async (req: Request, res: Response) => {
    try {
      return res.json(
        await this.advertService.getMine(res.locals.user.id, req.query),
      );
    } catch (error) {
      const details = errorDetails(error);
      if (details.status === 400 && details.code === 'INVALID_PAGINATION') {
        return res
          .status(400)
          .json({ code: details.code, message: details.message });
      }
      console.error('Cannot load own adverts:', error);
      return res.status(500).json({
        code: 'OWN_ADVERTS_LOAD_FAILED',
        message: 'Cannot load own adverts',
      });
    }
  };

  createAdvert = async (req: Request, res: Response) => {
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
      const details = errorDetails(error);
      const isExpectedError =
        details.status === 400 && details.code === 'INVALID_ADVERT_DATA';
      const status =
        isExpectedError ||
        (details.status !== undefined &&
          details.status >= 500 &&
          details.status < 600)
          ? details.status!
          : 500;
      if (!isExpectedError) {
        console.error('Cannot publish advert:', error);
      }
      return res.status(status).json({
        code: isExpectedError ? details.code : 'ADVERT_PUBLISH_FAILED',
        message: isExpectedError ? details.message : 'Cannot publish advert',
      });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    const { postId } = req.params;
    if (
      !('deletePost' in this.advertService) ||
      typeof this.advertService.deletePost !== 'function'
    ) {
      throw new TypeError('advertService.deletePost is not a function');
    }
    const success = await this.advertService.deletePost(postId);
    res.sendStatus(success ? 204 : 500);
  };

  getFilteredAdverts = async (req: Request, res: Response) => {
    try {
      const filters = req.body;
      const filteredAdverts =
        await this.advertService.getFilteredAdverts(filters);
      res.json(filteredAdverts);
    } catch (error) {
      console.log('Ошибка при фильтрации объявлений:', error);
      res
        .status(500)
        .json({ error: 'Ошибка на сервере при фильтрации объявлений' });
    }
  };

  getTagsBySearch = async (req: Request, res: Response) => {
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

  likedAdvertsHandler = async (req: Request, res: Response) => {
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

  getTopAdvertsByLikes = async (req: Request, res: Response) => {
    try {
      const topAdverts = await this.advertService.getTopAdvertsByLikes();
      res.status(200).json(topAdverts);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка при получении топ-объявлений' });
    }
  };
}

const advertController = new AdvertController(
  advertServiceInstance,
  publishAdvertServiceInstance,
);

export = advertController;
