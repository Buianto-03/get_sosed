const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const advertController = require('../controllers/advertController');
const advertRouter = express.Router();
const upload = require('../middlewares/getImage')

advertRouter
  .route('/')
  .get(advertController.getAdverts)
  .post(
    upload.array('files', 10),
    verifyAccessToken,
    advertController.createAdvert,
  )
  .get(advertController.getFilteredAdverts);

advertRouter
  .route('/filters')
  .post(advertController.getFilteredAdverts);
  // .get(advertController.getFilteredAdverts);

advertRouter
  .route('/liked')
  .get(verifyAccessToken, advertController.likedAdvertsHandler);

  advertRouter
  .route('/top')
  .get(advertController.getTopAdvertsByLikes);

advertRouter.route('/tags').get(advertController.getTagsBySearch);
advertRouter.route('/:postId').delete(advertController.deletePost);
advertRouter
  .route('/:advertId')
  .get(advertController.getAdvertById)
  .delete(advertController.deletePost);
//   .patch(verifyAccessToken, advertController.patchPost);

// advertRouter.route('/search').get(advertController.searchAdverts);
module.exports = advertRouter;
