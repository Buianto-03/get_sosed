const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const sharp = require('sharp');
const { sequelize, User, UserProfile } = require('../../db/models');

function signupError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

class SignupService {
  constructor(sequelize, user, userProfile) {
    this.sequelize = sequelize;
    this.user = user;
    this.userProfile = userProfile;
  }

  isValidName(name) {
    return typeof name === 'string' && name.trim().length > 0;
  }

  isValidEmail(email) {
    return (
      typeof email === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    );
  }

  isValidPassword(password) {
    return (
      typeof password === 'string' &&
      password.length >= 9 &&
      /\d/.test(password)
    );
  }

  isValidGender(gender) {
    return gender === undefined || ['', 'male', 'female'].includes(gender);
  }

  parseSignup(body) {
    const { name, email, password, gender } = body;
    if (
      !this.isValidName(name) ||
      !this.isValidEmail(email) ||
      !this.isValidPassword(password) ||
      !this.isValidGender(gender)
    ) {
      throw signupError(400, 'INVALID_SIGNUP_DATA', 'Invalid signup data');
    }
    return {
      name: name.trim(),
      email: email.trim(),
      password,
      gender: gender || null,
    };
  }

  async ensureEmailAvailable(email) {
    if (await this.user.findOne({ where: { email } })) {
      throw signupError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
    }
  }

  async preparePhoto(file) {
    if (!file) {
      return undefined;
    }
    try {
      return await sharp(file.buffer).webp().toBuffer();
    } catch {
      throw signupError(400, 'INVALID_PHOTO', 'Invalid photo');
    }
  }

  async getRegisteredUser(userId, transaction) {
    const result = await this.user.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'roleId'],
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
      transaction,
    });
    return result.get({ plain: true });
  }

  createPhotoPaths(userId) {
    const directory = `./public/images/users/user-${userId}`;
    const fileName = `user-${userId}.webp`;
    return {
      directory,
      filePath: `${directory}/${fileName}`,
      url: `/images/users/user-${userId}/${fileName}`,
    };
  }

  async writePhoto({ directory, filePath }, image) {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, image);
  }

  async removeCreatedPhoto(photoPath) {
    if (!photoPath) {
      return;
    }
    try {
      await fs.rm(photoPath, { force: true });
    } catch (error) {
      console.error('Cannot remove signup photo after rollback:', error);
    }
  }

  async signup(body, file) {
    const { name, email, password, gender } = this.parseSignup(body);
    await this.ensureEmailAvailable(email);
    const image = await this.preparePhoto(file);
    const hashpass = await bcrypt.hash(password, 10);
    let photoPath;
    try {
      return await this.sequelize.transaction(async (transaction) => {
        const newUser = await this.user.create(
          { name, email, hashpass },
          { transaction },
        );
        let photo = null;
        if (image) {
          const paths = this.createPhotoPaths(newUser.id);
          photoPath = paths.filePath;
          await this.writePhoto(paths, image);
          photo = paths.url;
        }
        await this.userProfile.create(
          { userId: newUser.id, gender, photo },
          { transaction },
        );
        return this.getRegisteredUser(newUser.id, transaction);
      });
    } catch (error) {
      await this.removeCreatedPhoto(photoPath);
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw signupError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
      }
      throw error;
    }
  }
}

module.exports = new SignupService(sequelize, User, UserProfile);
