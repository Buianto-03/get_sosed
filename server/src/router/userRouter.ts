import express = require('express');
import verifyAccessToken = require('../middlewares/verifyAccessToken');
import controller = require('../controllers/userController');
import handleUpload = require('../middlewares/handleUpload');
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
export = router;
