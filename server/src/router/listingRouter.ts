import express = require('express');
import verifyAccessToken = require('../middlewares/verifyAccessToken');
import listingController = require('../controllers/listingController');
const listingRouter = express.Router();
import handleUpload = require('../middlewares/handleUpload');

listingRouter
  .route('/')
  .get(listingController.getListings)
  .post(
    verifyAccessToken,
    handleUpload('files', true),
    listingController.createListing,
  )
  .get(listingController.getFilteredListings);

listingRouter.route('/filters').post(listingController.getFilteredListings);
listingRouter
  .route('/filters/page')
  .post(listingController.getFilteredListingsPage);
listingRouter.get('/fresh', listingController.getFreshListings);

listingRouter
  .route('/liked')
  .get(verifyAccessToken, listingController.likedListingsHandler);

listingRouter.route('/top').get(listingController.getTopListingsByLikes);

listingRouter.route('/tags').get(listingController.getTagsBySearch);
listingRouter.get('/mine', verifyAccessToken, listingController.getMine);
listingRouter.route('/:listingId').get(listingController.getListingById);

export = listingRouter;
