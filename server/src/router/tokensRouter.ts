import express = require('express');
import db = require('../../db/models');
const { User } = db;
import verifyRefreshToken = require('../middlewares/verifyRefreshToken');
import generateTokens = require('../utils/generateTokens');
import cookiesConfig = require('../configs/cookiesConfig');

const tokensRouter = express.Router();

tokensRouter.get('/refresh', verifyRefreshToken, async (req, res) => {
  try {
    const { id } = res.locals.user;
    const newUser = await User.findOne({
      where: { id },
      include: 'UserProfile',
    });
    if (!newUser) {
      throw new Error('User not found');
    }
    const user: Partial<(typeof newUser)['_attributes']> = newUser.get();

    delete user.hashpass;
    // console.log(user);

    const { accessToken, refreshToken } = generateTokens({ user });
    // console.log(accessToken, refreshToken);

    res
      .cookie('refreshToken', refreshToken, cookiesConfig)
      .json({ accessToken, user });
  } catch (error) {
    console.log(error);
    res.sendStatus(501);
  }
});

export = tokensRouter;
