const signupService = require('../service/signupService');
const generateTokens = require('../utils/generateTokens');
const cookiesConfig = require('../configs/cookiesConfig');

class AuthController {
  constructor(signupService) {
    this.signupService = signupService;
  }

  signup = async (req, res) => {
    try {
      const user = await this.signupService.signup(req.body, req.file);
      const { accessToken, refreshToken } = generateTokens({ user });
      res
        .cookie('refreshToken', refreshToken, cookiesConfig)
        .json({ accessToken, user });
    } catch (error) {
      const isExpectedError =
        (error.status === 400 && ['INVALID_SIGNUP_DATA', 'INVALID_PHOTO'].includes(error.code)) ||
        (error.status === 409 && error.code === 'EMAIL_ALREADY_EXISTS');
      const status = isExpectedError || (error.status >= 500 && error.status < 600)
        ? error.status
        : 500;
      if (!isExpectedError) {
        console.error('Cannot sign up user:', error);
      }
      res
        .status(status)
        .json({
          code: isExpectedError ? error.code : 'SIGNUP_FAILED',
          message: isExpectedError ? error.message : 'Cannot sign up user',
        });
    }
  };
}

module.exports = new AuthController(signupService);
