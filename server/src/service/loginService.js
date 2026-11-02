const bcrypt = require('bcrypt');
const { User, UserProfile } = require('../../db/models');

function invalidCredentials() {
  return Object.assign(new Error('Invalid email or password'), {
    status: 401,
    code: 'INVALID_CREDENTIALS',
  });
}

class LoginService {
  constructor(user, userProfile) {
    this.user = user;
    this.userProfile = userProfile;
  }

  async login(body) {
    const { email, password } = body || {};
    if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
      throw invalidCredentials();
    }
    const targetUser = await this.user.findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'roleId', 'hashpass'],
      include: [{
        model: this.userProfile,
        attributes: ['about', 'city', 'intent', 'habits', 'age', 'gender', 'photo', 'phoneNumber'],
      }],
    });
    if (!targetUser || !(await bcrypt.compare(password, targetUser.hashpass))) {
      throw invalidCredentials();
    }
    const { hashpass, ...user } = targetUser.get({ plain: true });
    return user;
  }
}

module.exports = new LoginService(User, UserProfile);
