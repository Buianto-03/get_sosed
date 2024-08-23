const { Router } = require("express");
const likeController = require('../controllers/likeController')

const router = Router();

router.get("/:advertId", likeController.getLikes);

module.exports = router;
