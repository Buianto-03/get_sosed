const userService = require('../service/userService');
const profileService = require('../service/profileService');
const isValidId = (value) =>
  /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
class UserController {
  constructor(userService, profileService) {
    this.userService = userService;
    this.profileService = profileService;
  }

  getUsers = async (req, res) => {
    try {
      res.json(await this.userService.getUsers());
    } catch (error) {
      console.error('Cannot load users:', error);
      res
        .status(500)
        .json({ code: 'USERS_LOAD_FAILED', message: 'Cannot load users' });
    }
  };

  getReceiverUsers = async (req, res) => {
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

  getSummary = async (req, res) => {
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

  patchUser = async (req, res) => {
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
      const isExpectedError =
        (error.status === 400 && error.code === 'INVALID_PROFILE_DATA') ||
        (error.status === 404 && error.code === 'USER_NOT_FOUND');
      const status =
        isExpectedError || (error.status >= 500 && error.status < 600)
          ? error.status
          : 500;
      if (!isExpectedError) {
        console.error('Cannot update profile:', error);
      }
      return res.status(status).json({
        code: isExpectedError ? error.code : 'PROFILE_UPDATE_FAILED',
        message: isExpectedError ? error.message : 'Cannot update profile',
      });
    }
  };
}
module.exports = new UserController(userService, profileService);
