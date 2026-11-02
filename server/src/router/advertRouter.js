const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const advertController = require('../controllers/advertController');
const advertRouter = express.Router();
const handleUpload = require('../middlewares/handleUpload');

advertRouter
  .route('/')
  .get(advertController.getAdverts)
  .post(
    verifyAccessToken,
    handleUpload('files', true),
    advertController.createAdvert,
  )
  .get(advertController.getFilteredAdverts);

advertRouter.route('/filters').post(advertController.getFilteredAdverts);

advertRouter
  .route('/liked')
  .get(verifyAccessToken, advertController.likedAdvertsHandler);

advertRouter.route('/top').get(advertController.getTopAdvertsByLikes);

advertRouter.route('/tags').get(advertController.getTagsBySearch);
advertRouter.get('/mine', verifyAccessToken, advertController.getMine);
advertRouter.route('/:postId').delete(advertController.deletePost);
advertRouter
  .route('/:advertId')
  .get(advertController.getAdvertById)
  .delete(advertController.deletePost);

module.exports = advertRouter;
