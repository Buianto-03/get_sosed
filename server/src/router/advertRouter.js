const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const advertController = require('../controllers/advertController');

const advertRouter = express.Router();

advertRouter
  .route('/')
  .get(advertController.getAdverts)
//   .post(verifyAccessToken, advertController.createPost);

// advertRouter
//   .route('/:postId')
//   .delete(verifyAccessToken, advertController.deletePost)
//   .patch(verifyAccessToken, advertController.patchPost);

module.exports = advertRouter;
