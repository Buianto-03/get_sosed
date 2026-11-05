import jwtConfig = require('./jwtConfig');
import type { CookieOptions } from 'express';

const cookiesConfig: CookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE !== 'false',
  sameSite: 'lax',
  maxAge: Number(jwtConfig.refresh.expiresIn),
};

export = cookiesConfig;
