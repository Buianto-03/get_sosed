const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const controller = require('../controllers/userController');
const handleUpload = require('../middlewares/handleUpload');
const router = express.Router();
router.get('/', verifyAccessToken, controller.getUsers);
router.get('/:userId/summary', verifyAccessToken, controller.getSummary);
router.get('/:userId', verifyAccessToken, controller.getReceiverUsers);
router.patch(
  '/:userId',
  verifyAccessToken,
  handleUpload('photo'),
  controller.patchUser,
);
module.exports = router;
