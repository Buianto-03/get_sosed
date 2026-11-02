import type { NextFunction, Request, Response } from 'express';
import jwt = require('jsonwebtoken');

require('dotenv').config();

function verifyRefreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.cookies;
    const { user } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as jwt.JwtPayload;

    res.locals.user = user;

    next();
  } catch (error) {
    console.log('Invalid refresh token');
    res.clearCookie('refreshToken').sendStatus(401);
  }
}
export = verifyRefreshToken;
