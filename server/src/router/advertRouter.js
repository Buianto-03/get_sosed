const express = require('express');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const advertController = require('../controllers/advertController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('image')) {
      cb(null, true);
    }
  },
});
const advertRouter = express.Router();

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
  // .post(advertController.getFilteredAdverts);
  .get(advertController.getFilteredAdverts);

advertRouter.route('/:postId').delete(advertController.deletePost);
advertRouter
  .route('/:advertId')
  .get(advertController.getAdvertById)
  .delete(advertController.deletePost);
//   .patch(verifyAccessToken, advertController.patchPost);

module.exports = advertRouter;
