import type { NextFunction, Request, Response } from 'express';
import jwt = require('jsonwebtoken');

require('dotenv').config();

function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.headers.authorization!.split(' ')[1]; // 'Bearer token'
    const { user } = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as jwt.JwtPayload;

    res.locals.user = user;

    next();
  } catch (error) {
    console.log('Invalid access token');
    res.status(403).send('Invalid access token');
  }
}

export = verifyAccessToken;
