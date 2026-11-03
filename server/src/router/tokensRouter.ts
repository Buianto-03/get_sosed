import express = require('express');
import type { AuthResponse } from '../types/auth';
import db = require('../../db/models');
const { User } = db;
import verifyRefreshToken = require('../middlewares/verifyRefreshToken');
import generateTokens = require('../utils/generateTokens');
import cookiesConfig = require('../configs/cookiesConfig');

const tokensRouter = express.Router();

tokensRouter.get('/refresh', verifyRefreshToken, async (req, res: AuthResponse) => {
  try {
    const { id } = res.locals.user;
    const newUser = await User.findOne({
      where: { id },
      include: 'UserProfile',
    });
    if (!newUser) {
      throw new Error('User not found');
    }
    const { hashpass, ...user } = newUser.get();

    const { accessToken, refreshToken } = generateTokens({ user });

    res
      .cookie('refreshToken', refreshToken, cookiesConfig)
      .json({ accessToken, user });
  } catch (error) {
    console.log(error);
    res.sendStatus(501);
  }
});

export = tokensRouter;
