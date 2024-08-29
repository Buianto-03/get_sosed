const express = require('express');
const bcrypt = require('bcrypt');
const { User, UserProfile, UserPhoto } = require('../../db/models');
const generateTokens = require('../utils/generateTokens');
const cookiesConfig = require('../configs/cookiesConfig');
const upload = require('../middlewares/getImage');
const fs = require('fs/promises');
const sharp = require('sharp');

const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const targetUser = await User.findOne({
    where: { email },
    include: 'UserProfile',
  });
  if (!targetUser) return res.sendStatus(401);

  const isValid = await bcrypt.compare(password, targetUser.hashpass);
  if (!isValid) return res.sendStatus(401);

  const user = targetUser.get();
  delete user.hashpass;

  const { accessToken, refreshToken } = generateTokens({ user });

  // console.log(user);

  res
    .cookie('refreshToken', refreshToken, cookiesConfig)
    .json({ accessToken, user });
});

authRouter.post('/signup', upload.single('file'), async (req, res) => {
  console.log(req.body, req.file);

  const { email, password, name } = req.body;
  const { gender } = req.body;

  if (password.length < 9) return res.sendStatus(400);

  const hashpass = await bcrypt.hash(password, 10);
  const [newUser, created] = await User.findOrCreate({
    where: { email },
    defaults: { name, hashpass },
  });
  if (!created) return res.sendStatus(403);

  const user = newUser.get();
  delete user.hashpass;

  console.log(user);
  await fs.mkdir(`./public/images/users/user-${user.id}`);
  const fileName = `user-${user.id}.webp`;
  const outputBuffer = await sharp(req.file.buffer).webp().toBuffer();
  await fs.writeFile(
    `./public/images/users/user-${user.id}/${fileName}`,
    outputBuffer,
  );

  const userProfile = await UserProfile.create({
    userId: user.id,
    gender,
    photo: `/images/users/user-${user.id}/${fileName}`,
  });

  const userWithProfile = await User.findByPk(user.id, {
    include: 'UserProfile',
  });

  const correctUser = JSON.parse(JSON.stringify(userWithProfile));
  delete correctUser.hashpass;

  const { accessToken, refreshToken } = generateTokens({ user: correctUser });

  res
    .cookie('refreshToken', refreshToken, cookiesConfig)
    .json({ accessToken, user: correctUser });
});

authRouter.get('/logout', (req, res) => {
  res.clearCookie('refreshToken').sendStatus(200);
});

module.exports = authRouter;
