import type { NextFunction, Request } from 'express';
import type { AuthResponse } from '../types/auth';
import jwt = require('jsonwebtoken');
import getTokenUser = require('../utils/getTokenUser');

require('dotenv').config();

function verifyRefreshToken(req: Request, res: AuthResponse, next: NextFunction) {
  try {
    const { refreshToken } = req.cookies;
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    );

    res.locals.user = getTokenUser(payload);

    next();
  } catch (error) {
    console.log('Invalid refresh token');
    res.clearCookie('refreshToken').sendStatus(401);
  }
}
export = verifyRefreshToken;
