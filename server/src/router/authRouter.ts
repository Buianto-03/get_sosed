import express = require('express');
import handleUpload = require('../middlewares/handleUpload');
import authController = require('../controllers/authController');

const authRouter = express.Router();

authRouter.post('/login', authController.login);
authRouter.post('/signup', handleUpload('file'), authController.signup);
authRouter.get('/logout', authController.logout);

export = authRouter;
