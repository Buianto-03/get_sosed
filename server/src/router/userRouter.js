const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const userController = require('../controllers/userController');

const userRouter = express.Router();

userRouter
  .route('/')
  .get(userController.getUsers)
//   .post(verifyAccessToken, userController.createPost);

// userRouter
//   .route('/:postId')
//   .delete(verifyAccessToken, userController.deletePost)
//   .patch(verifyAccessToken, userController.patchPost);

module.exports = userRouter;
