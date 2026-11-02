import type { Request, Response } from 'express';

import signupServiceInstance = require('../service/signupService');
import loginServiceInstance = require('../service/loginService');
import generateTokens = require('../utils/generateTokens');
import cookiesConfig = require('../configs/cookiesConfig');

interface ErrorDetails {
  status?: number;
  code?: string;
  message?: string;
}

function errorDetails(error: unknown): ErrorDetails {
  return typeof error === 'object' && error !== null
    ? (error as ErrorDetails)
    : {};
}

class AuthController {
  constructor(
    private readonly signupService: typeof signupServiceInstance,
    private readonly loginService: typeof loginServiceInstance,
  ) {}

  login = async (req: Request, res: Response) => {
    try {
      const user = await this.loginService.login(req.body);
      const { accessToken, refreshToken } = generateTokens({ user });
      res
        .cookie('refreshToken', refreshToken, cookiesConfig)
        .json({ accessToken, user });
    } catch (error) {
      const details = errorDetails(error);
      const isExpectedError =
        details.status === 401 && details.code === 'INVALID_CREDENTIALS';
      if (!isExpectedError) {
        console.error('Cannot log in user:', error);
      }
      res.status(isExpectedError ? 401 : 500).json({
        code: isExpectedError ? 'INVALID_CREDENTIALS' : 'LOGIN_FAILED',
        message: isExpectedError
          ? 'Invalid email or password'
          : 'Cannot log in user',
      });
    }
  };

  logout = (req: Request, res: Response) => {
    try {
      res.clearCookie('refreshToken').sendStatus(200);
    } catch (error) {
      console.error('Cannot log out user:', error);
      res
        .status(500)
        .json({ code: 'LOGOUT_FAILED', message: 'Cannot log out user' });
    }
  };

  signup = async (req: Request, res: Response) => {
    try {
      const user = await this.signupService.signup(req.body, req.file);
      const { accessToken, refreshToken } = generateTokens({ user });
      res
        .cookie('refreshToken', refreshToken, cookiesConfig)
        .json({ accessToken, user });
    } catch (error) {
      const details = errorDetails(error);
      const isExpectedError =
        (details.status === 400 &&
          ['INVALID_SIGNUP_DATA', 'INVALID_PHOTO'].includes(
            details.code ?? '',
          )) ||
        (details.status === 409 && details.code === 'EMAIL_ALREADY_EXISTS');
      const status =
        isExpectedError ||
        (details.status !== undefined &&
          details.status >= 500 &&
          details.status < 600)
          ? details.status!
          : 500;
      if (!isExpectedError) {
        console.error('Cannot sign up user:', error);
      }
      res.status(status).json({
        code: isExpectedError ? details.code : 'SIGNUP_FAILED',
        message: isExpectedError ? details.message : 'Cannot sign up user',
      });
    }
  };
}

export = new AuthController(signupServiceInstance, loginServiceInstance);
