import bcrypt = require('bcrypt');

import db = require('../../db/models');
import AppError = require('../utils/appError');

const { User, UserProfile } = db;

interface LoginInput {
  email?: unknown;
  password?: unknown;
}

function invalidCredentials() {
  return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
}

class LoginService {
  constructor(
    private readonly user: typeof db.User,
    private readonly userProfile: typeof db.UserProfile,
  ) {}

  async login(body: LoginInput | null | undefined) {
    const { email, password } = body || {};
    if (
      typeof email !== 'string' ||
      !email ||
      typeof password !== 'string' ||
      !password
    ) {
      throw invalidCredentials();
    }
    const targetUser = await this.user.findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'roleId', 'hashpass'],
      include: [
        {
          model: this.userProfile,
          attributes: [
            'about',
            'city',
            'intent',
            'habits',
            'age',
            'gender',
            'photo',
            'phoneNumber',
          ],
        },
      ],
    });
    if (!targetUser) {
      throw invalidCredentials();
    }
    if (targetUser.hashpass === null) {
      throw new Error('User password hash is missing');
    }
    if (!(await bcrypt.compare(password, targetUser.hashpass))) {
      throw invalidCredentials();
    }
    const { hashpass, ...user } = targetUser.get({ plain: true });
    return user;
  }
}

export = new LoginService(User, UserProfile);
