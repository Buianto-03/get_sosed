const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const advertController = require('../controllers/advertController');

const advertRouter = express.Router();

advertRouter
  .route('/')
  .get(advertController.getAdverts)
  .post(advertController.createPost);

advertRouter
  .route('/:advertId')
  .get(advertController.getAdvertById)
  .delete(advertController.deletePost)
//   .patch(verifyAccessToken, advertController.patchPost);

module.exports = advertRouter;
