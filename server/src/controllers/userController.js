const userService = require('../service/userService');
const verifyAccessToken = require('../middlewares/verifyAccessToken');
const fs = require('fs/promises');
const sharp = require('sharp');

class UserController {
  constructor(service) {
    this.service = service;
  }

  getUsers = (req, res) => {
    this.service.getUsers().then((data) => res.json(data));
  };

  getReceiverUsers = async (req, res) => {
    // const { id } = res.locals.user;
    const { userId } = req.params;
    // console.log(req.params);

    const receiversList = await this.service.getReceiverUsers(userId);
    res.json(receiversList);
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

  patchUser = async (req, res) => {
    try {
      const { id } = res.locals.user;

      if (req.file) {
        const files = await fs.readdir(`./public/images/users/user-${id}`);

        if (files.length) {
          await fs.rm(`./public/images/users/user-${id}/${files[0]}`);
        }
        const fileName = `${new Date().getMilliseconds()}0.webp`;
        const outputBuffer = await sharp(req.file.buffer).webp().toBuffer();
        await fs.writeFile(
          `./public/images/users/user-${id}/${fileName}`,
          outputBuffer,
        );
        const updatedUser = await this.service.editUser(
          { ...req.body, photo: `/images/users/user-${id}/${fileName}` },
          id,
        );
        res.json(updatedUser);
      } else {
        const updatedUser = await this.service.editUser(req.body, id);
        res.json(updatedUser);
      }
    } catch (error) {
      console.log(error);
    }
  };
}

const userContrller = new UserController(userService);

module.exports = userContrller;
