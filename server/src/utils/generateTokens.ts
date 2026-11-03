import type { AuthPayload } from '../types/auth';
import jwt = require('jsonwebtoken');
import jwtConfig = require('../configs/jwtConfig');
require('dotenv').config();

function generateTokens(payload: AuthPayload) {
  return {
    accessToken: jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET!,
      jwtConfig.access,
    ),
    refreshToken: jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET!,
      jwtConfig.refresh,
    ),
  };
}

export = generateTokens;
