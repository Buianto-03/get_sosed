const express = require('express');
const bcrypt = require('bcrypt');
const { User, UserProfile } = require('../../db/models');
const generateTokens = require('../utils/generateTokens');
const cookiesConfig = require('../configs/cookiesConfig');

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

authRouter.post('/signup', async (req, res) => {
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

  const userProfile = await UserProfile.create({
    userId: user.id,
    gender,
  });

  const userWithProfile = await User.findByPk(user.id, {
    include: 'UserProfile',
  });

  const correctUser = JSON.parse(JSON.stringify(userWithProfile));
  delete correctUser.hashpass;

  console.log(correctUser);

  const { accessToken, refreshToken } = generateTokens({ correctUser });

  res
    .cookie('refreshToken', refreshToken, cookiesConfig)
    .json({ accessToken, user: correctUser });
});

authRouter.get('/logout', (req, res) => {
  res.clearCookie('refreshToken').sendStatus(200);
});

module.exports = authRouter;
