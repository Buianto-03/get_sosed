import type { Transaction } from 'sequelize';
import bcrypt = require('bcrypt');
import fs = require('fs/promises');
import sharp = require('sharp');

import db = require('../../db/models');
import AppError = require('../utils/appError');

const { sequelize, User, UserProfile } = db;

interface SignupInput {
  name: unknown;
  email: unknown;
  password: unknown;
  gender?: unknown;
}

function signupError(status: number, code: string, message: string) {
  return new AppError(status, code, message);
}

class SignupService {
  constructor(
    private readonly sequelize: typeof db.sequelize,
    private readonly user: typeof db.User,
    private readonly userProfile: typeof db.UserProfile,
  ) {}

  isValidName(name: unknown): name is string {
    return typeof name === 'string' && name.trim().length > 0;
  }

  isValidEmail(email: unknown): email is string {
    return (
      typeof email === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    );
  }

  isValidPassword(password: unknown): password is string {
    return (
      typeof password === 'string' &&
      password.length >= 9 &&
      /\d/.test(password)
    );
  }

  isValidGender(gender: unknown): gender is string | undefined {
    return (
      gender === undefined ||
      (typeof gender === 'string' && ['', 'male', 'female'].includes(gender))
    );
  }

  parseSignup(body: SignupInput) {
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

  async ensureEmailAvailable(email: string) {
    if (await this.user.findOne({ where: { email } })) {
      throw signupError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
    }
  }

  async preparePhoto(file: Express.Multer.File | undefined) {
    if (!file) {
      return undefined;
    }
    try {
      return await sharp(file.buffer).webp().toBuffer();
    } catch {
      throw signupError(400, 'INVALID_PHOTO', 'Invalid photo');
    }
  }

  async getRegisteredUser(userId: number, transaction: Transaction) {
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
    if (!result) {
      throw new Error('Registered user not found');
    }
    return result.get({ plain: true });
  }

  createPhotoPaths(userId: number) {
    const directory = `./public/images/users/user-${userId}`;
    const fileName = `user-${userId}.webp`;
    return {
      directory,
      filePath: `${directory}/${fileName}`,
      url: `/images/users/user-${userId}/${fileName}`,
    };
  }

  async writePhoto(
    { directory, filePath }: { directory: string; filePath: string },
    image: Buffer,
  ) {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, image);
  }

  async removeCreatedPhoto(photoPath: string | undefined) {
    if (!photoPath) {
      return;
    }
    try {
      await fs.rm(photoPath, { force: true });
    } catch (error) {
      console.error('Cannot remove signup photo after rollback:', error);
    }
  }

  async signup(body: SignupInput, file: Express.Multer.File | undefined) {
    const { name, email, password, gender } = this.parseSignup(body);
    await this.ensureEmailAvailable(email);
    const image = await this.preparePhoto(file);
    const hashpass = await bcrypt.hash(password, 10);
    let photoPath: string | undefined;
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
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw signupError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
      }
      throw error;
    }
  }
}

export = new SignupService(sequelize, User, UserProfile);
