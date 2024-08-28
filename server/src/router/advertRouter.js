const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const advertController = require('../controllers/advertController');

const advertRouter = express.Router();

advertRouter
  .route('/')
  .get(advertController.getAdverts)
  .post(advertController.createPost);

advertRouter
  .route('/filters')
  // .post(advertController.getFilteredAdverts);
  .get(advertController.getFilteredAdverts);

advertRouter.route('/tags').get(advertController.getTagsBySearch);
advertRouter.route('/:postId').delete(advertController.deletePost);
advertRouter
  .route('/:advertId')
  .get(advertController.getAdvertById)
  .delete(advertController.deletePost);
//   .patch(verifyAccessToken, advertController.patchPost);

// advertRouter.route('/search').get(advertController.searchAdverts);
module.exports = advertRouter;
