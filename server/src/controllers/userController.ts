import type { Request } from 'express';
import type { AuthResponse } from '../types/auth';
import errorDetails = require('../utils/errorDetails');

import userServiceInstance = require('../service/userService');
import profileServiceInstance = require('../service/profileService');

const isValidId = (value: unknown) =>
  /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
class UserController {
  constructor(
    private readonly userService: typeof userServiceInstance,
    private readonly profileService: typeof profileServiceInstance,
  ) {}

  getUsers = async (req: Request, res: AuthResponse) => {
    try {
      res.json(await this.userService.getUsers());
    } catch (error) {
      console.error('Cannot load users:', error);
      res
        .status(500)
        .json({ code: 'USERS_LOAD_FAILED', message: 'Cannot load users' });
    }
  };

  getReceiverUsers = async (req: Request, res: AuthResponse) => {
    if (
      !isValidId(req.params.userId) ||
      Number(req.params.userId) !== res.locals.user.id
    ) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Forbidden' });
    }

    try {
      return res.json(
        await this.userService.getReceiverUsers(res.locals.user.id),
      );
    } catch (error) {
      console.error('Cannot load conversations:', error);
      return res.status(500).json({
        code: 'CONVERSATIONS_LOAD_FAILED',
        message: 'Cannot load conversations',
      });
    }
  };

  getSummary = async (req: Request, res: AuthResponse) => {
    if (!isValidId(req.params.userId)) {
      return res
        .status(404)
        .json({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    try {
      const user = await this.userService.getSummary(Number(req.params.userId));
      if (!user) {
        return res
          .status(404)
          .json({ code: 'USER_NOT_FOUND', message: 'User not found' });
      }
      return res.json(user);
    } catch (error) {
      console.error('Cannot load user:', error);
      return res
        .status(500)
        .json({ code: 'USER_LOAD_FAILED', message: 'Cannot load user' });
    }
  };

  patchUser = async (req: Request, res: AuthResponse) => {
    if (
      !isValidId(req.params.userId) ||
      Number(req.params.userId) !== res.locals.user.id
    ) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Forbidden' });
    }

    try {
      return res.json(
        await this.profileService.editProfile(
          res.locals.user.id,
          req.body,
          req.file,
        ),
      );
    } catch (error) {
      const details = errorDetails(error);
      const isExpectedError =
        (details.status === 400 && details.code === 'INVALID_PROFILE_DATA') ||
        (details.status === 404 && details.code === 'USER_NOT_FOUND');
      const status =
        isExpectedError ||
        (details.status !== undefined &&
          details.status >= 500 &&
          details.status < 600)
          ? (details.status ?? 500)
          : 500;
      if (!isExpectedError) {
        console.error('Cannot update profile:', error);
      }
      return res.status(status).json({
        code: isExpectedError ? details.code : 'PROFILE_UPDATE_FAILED',
        message: isExpectedError ? details.message : 'Cannot update profile',
      });
    }
  };
}
export = new UserController(userServiceInstance, profileServiceInstance);
