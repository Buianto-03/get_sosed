import { Router } from 'express';
import verifyAccessToken = require('../middlewares/verifyAccessToken');
import likeController = require('../controllers/likeController');

const router = Router();

router
  .route('/:advertId')
  .get(likeController.getLikes)
  .post(verifyAccessToken, likeController.setLike)
  .delete(verifyAccessToken, likeController.deleteLike);

export = router;
