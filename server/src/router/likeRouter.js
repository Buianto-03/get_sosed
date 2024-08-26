const { Router } = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const likeController = require('../controllers/likeController');

const router = Router();

router
  .route('/:advertId')
  .get(likeController.getLikes)
  .post(verifyAccessToken, likeController.setLike)
  .delete(verifyAccessToken, likeController.deleteLike);

module.exports = router;
