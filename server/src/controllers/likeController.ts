import type { Request, Response } from 'express';
import type { AuthResponse } from '../types/auth';
import errorDetails = require('../utils/errorDetails');

import likeServiceInstance = require('../service/likeService');

class LikeController {
  constructor(
    private readonly service: typeof likeServiceInstance,
  ) {}

  getLikes = async (req: Request, res: Response) => {
    try {
      const { advertId } = req.params;
      const likes = await this.service.getLikesByAdvertId(advertId);
      res.status(200).json(likes);
    } catch (error) {
      res.status(500).json({ error: errorDetails(error).message });
    }
  };

  setLike = async (req: Request, res: AuthResponse) => {
    try {
      const { advertId } = req.params;
      const userId = res.locals.user.id;
      const { like, created } = await this.service.postLike(advertId, userId);
      return res.status(created ? 201 : 200).json(like);
    } catch (error) {
      res.status(500).json({ error: errorDetails(error).message });
    }
  };

  deleteLike = async (req: Request, res: AuthResponse) => {
    try {
      const { advertId } = req.params;
      const userId = res.locals.user.id;
      const like = await this.service.deleteLike(advertId, userId);
      res.status(200).json(like);
    } catch (error) {
      res.status(500).json({ error: errorDetails(error).message });
    }
  };
}

const likeController = new LikeController(likeServiceInstance);

export = likeController;
