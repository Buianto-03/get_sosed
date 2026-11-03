import type { NextFunction, Request } from 'express';
import type { AuthResponse } from '../types/auth';
import jwt = require('jsonwebtoken');
import getTokenUser = require('../utils/getTokenUser');

require('dotenv').config();

function verifyAccessToken(
  req: Request,
  res: AuthResponse,
  next: NextFunction,
) {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1]; // 'Bearer token'
    if (!accessToken) {
      throw new Error('Missing access token');
    }
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);

    res.locals.user = getTokenUser(payload);

    next();
  } catch (error) {
    console.log('Invalid access token');
    res.status(403).send('Invalid access token');
  }
}

export = verifyAccessToken;
