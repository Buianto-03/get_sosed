const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const userController = require('../controllers/userController');
const upload = require('../middlewares/getImage');

const userRouter = express.Router();

userRouter.route('/').get(userController.getUsers);
//   .post(verifyAccessToken, userController.createPost);

userRouter
  .route('/:userId')
  .get(userController.getReceiverUsers)
  //   .delete(verifyAccessToken, userController.deletePost)
  .patch(upload.single('photo'), verifyAccessToken, userController.patchUser);

module.exports = userRouter;
