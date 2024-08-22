const advertService = require('../service/advertService');

class AdvertController {
  constructor(service) {
    this.service = service;
  }

  getAdverts = (req, res) => {
    this.service.getAdverts().then((data) => res.json(data));
  };

  //   createPost = async (req, res) => {
  //     try {
  //       const newPost = await this.service.addPost({
  //         ...req.body,
  //         userId: res.locals.user.id,
  //       });
  //       res.status(201).json(newPost);
  //     } catch (error) {
  //       console.log(error);
  //       res.sendStatus(500);
  //     }
  //   };

  //   deletePost = async (req, res) => {
  //     const { postId } = req.params;
  //     const success = await this.service.deletePost(postId);
  //     res.sendStatus(success ? 204 : 500);
  //   };

  //   patchPost = async (req, res) => {
  //     const { postId } = req.params;
  //     const updatedPost = await this.service.editPost(req.body, postId);
  //     res.json(updatedPost);
  //   };
}

const advertController = new AdvertController(advertService);

module.exports = advertController;
