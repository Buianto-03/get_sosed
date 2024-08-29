const express = require('express');
const { User } = require('../../db/models');
const verifyRefreshToken = require('../middlewares/verifyRefreshToken');
const generateTokens = require('../utils/generateTokens');
const cookiesConfig = require('../configs/cookiesConfig');

const tokensRouter = express.Router();

tokensRouter.get('/refresh', verifyRefreshToken, async (req, res) => {
  try {
    const { id } = res.locals.user;
    const newUser = await User.findOne({
      where: { id },
      include: 'UserProfile',
    });
    const user = newUser.get();

    delete user.hashpass;
    // console.log(user);

    const { accessToken, refreshToken } = generateTokens({ user });
    // console.log(accessToken, refreshToken);

    res
      .cookie('refreshToken', refreshToken, cookiesConfig)
      .json({ accessToken, user });
  } catch (error) {
    console.log(error);
    res.sendStatus(501)
  }
});

module.exports = tokensRouter;
