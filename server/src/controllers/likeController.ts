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
      const { listingId: listingId } = req.params;
      const likes = await this.service.getLikesByListingId(listingId);
      res.status(200).json(likes);
    } catch (error) {
      res.status(500).json({ error: errorDetails(error).message });
    }
  };

  setLike = async (req: Request, res: AuthResponse) => {
    try {
      const { listingId: listingId } = req.params;
      const userId = res.locals.user.id;
      const { like, created } = await this.service.postLike(listingId, userId);
      return res.status(created ? 201 : 200).json(like);
    } catch (error) {
      res.status(500).json({ error: errorDetails(error).message });
    }
  };

  deleteLike = async (req: Request, res: AuthResponse) => {
    try {
      const { listingId: listingId } = req.params;
      const userId = res.locals.user.id;
      const like = await this.service.deleteLike(listingId, userId);
      res.status(200).json(like);
    } catch (error) {
      res.status(500).json({ error: errorDetails(error).message });
    }
  };
}

const likeController = new LikeController(likeServiceInstance);

export = likeController;
