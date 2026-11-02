const express = require('express');
const handleUpload = require('../middlewares/handleUpload');
const authController = require('../controllers/authController');

const authRouter = express.Router();

authRouter.post('/login', authController.login);
authRouter.post('/signup', handleUpload('file'), authController.signup);
authRouter.get('/logout', authController.logout);

module.exports = authRouter;
