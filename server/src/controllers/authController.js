const signupService = require('../service/signupService');
const loginService = require('../service/loginService');
const generateTokens = require('../utils/generateTokens');
const cookiesConfig = require('../configs/cookiesConfig');

class AuthController {
  constructor(signupService, loginService) {
    this.signupService = signupService;
    this.loginService = loginService;
  }

  login = async (req, res) => {
    try {
      const user = await this.loginService.login(req.body);
      const { accessToken, refreshToken } = generateTokens({ user });
      res
        .cookie('refreshToken', refreshToken, cookiesConfig)
        .json({ accessToken, user });
    } catch (error) {
      const isExpectedError = error.status === 401 && error.code === 'INVALID_CREDENTIALS';
      if (!isExpectedError) console.error('Cannot log in user:', error);
      res.status(isExpectedError ? 401 : 500).json({
        code: isExpectedError ? 'INVALID_CREDENTIALS' : 'LOGIN_FAILED',
        message: isExpectedError ? 'Invalid email or password' : 'Cannot log in user',
      });
    }
  };

  logout = (req, res) => {
    try {
      res.clearCookie('refreshToken').sendStatus(200);
    } catch (error) {
      console.error('Cannot log out user:', error);
      res.status(500).json({ code: 'LOGOUT_FAILED', message: 'Cannot log out user' });
    }
  };

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

module.exports = new AuthController(signupService, loginService);
