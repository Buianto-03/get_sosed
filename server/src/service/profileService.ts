import type { Attributes, Transaction } from 'sequelize';
import { randomUUID } from 'crypto';
import fs = require('fs/promises');
import sharp = require('sharp');

import db = require('../../db/models');
import AppError = require('../utils/appError');

const { sequelize, User, UserProfile } = db;

const invalid = () =>
  new AppError(400, 'INVALID_PROFILE_DATA', 'Invalid profile data');

class ProfileService {
  constructor(
    private readonly sequelize: typeof db.sequelize,
    private readonly user: typeof db.User,
    private readonly userProfile: typeof db.UserProfile,
  ) {}

  parseProfile(body: Record<string, unknown>) {
    const values: Partial<Attributes<InstanceType<typeof db.UserProfile>>> & {
      name?: string | null;
    } = {};
    const limits = [
      ['name', 100],
      ['about', 500],
      ['city', 100],
      ['intent', 255],
      ['phoneNumber', 32],
      ['gender', 30],
    ] as const;

    for (const [field, limit] of limits) {
      const value = body[field];
      if (value === undefined) {
        continue;
      }
      if (typeof value !== 'string' || value.trim().length > limit) {
        throw invalid();
      }
      if (field === 'name' && value.trim().length < 2) {
        throw invalid();
      }
      if (
        field === 'phoneNumber' &&
        value &&
        !/^[+\d ()-]{5,32}$/.test(value)
      ) {
        throw invalid();
      }
      values[field] = value.trim() || null;
    }

    if (body.age !== undefined) {
      const age = body.age === '' ? null : Number(body.age);
      if (age !== null && (!Number.isInteger(age) || age < 18 || age > 120)) {
        throw invalid();
      }
      values.age = age;
    }

    if (body.habits !== undefined) {
      let habits: unknown;
      try {
        habits = JSON.parse(body.habits as string);
      } catch {
        throw invalid();
      }
      if (
        !Array.isArray(habits) ||
        habits.length > 20 ||
        habits.some(
          (item) =>
            typeof item !== 'string' || !item.trim() || item.trim().length > 40,
        )
      ) {
        throw invalid();
      }

      values.habits = [...new Set(habits.map((item) => item.trim()))];
    }
    if (
      body.removePhoto !== undefined &&
      (typeof body.removePhoto !== 'string' ||
        !['true', 'false'].includes(body.removePhoto))
    ) {
      throw invalid();
    }
    return values;
  }

  async preparePhoto(
    file: Express.Multer.File | undefined,
    removePhoto: boolean,
  ) {
    if (file && removePhoto) {
      throw invalid();
    }
    if (!file) {
      return undefined;
    }

    if (file.size > 5 * 1024 * 1024) {
      throw invalid();
    }
    try {
      return await sharp(file.buffer).webp().toBuffer();
    } catch {
      throw invalid();
    }
  }

  async getUserForUpdate(id: number, transaction: Transaction) {
    const user = await this.user.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    return user;
  }

  async getOrCreateProfile(id: number, transaction: Transaction) {
    const [profile] = await this.userProfile.findOrCreate({
      where: { userId: id },
      defaults: { photo: null },
      transaction,
    });
    return profile;
  }

  getProfileUser(id: number, transaction: Transaction) {
    return this.user.findByPk(id, {
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
  }

  createPhotoPaths(id: number) {
    const directory = `./public/images/users/user-${id}`;
    const fileName = `${randomUUID()}.webp`;
    return {
      directory,
      filePath: `${directory}/${fileName}`,
      url: `/images/users/user-${id}/${fileName}`,
    };
  }

  async writePhoto(
    { directory, filePath }: { directory: string; filePath: string },
    image: Buffer,
  ) {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, image);
  }

  async removePreviousPhoto(id: number, photoUrl: string | null | undefined) {
    if (
      !photoUrl ||
      !new RegExp(`^/images/users/user-${id}/[^/]+\\.webp$`).test(photoUrl)
    ) {
      return;
    }
    try {
      await fs.rm(`./public${photoUrl}`, { force: true });
    } catch (error) {
      console.error('Cannot remove previous profile photo:', error);
    }
  }

  async removeCreatedPhoto(filePath: string | undefined) {
    if (!filePath) {
      return;
    }
    try {
      await fs.rm(filePath, { force: true });
    } catch (error) {
      console.error('Cannot remove profile photo after rollback:', error);
    }
  }

  async editProfile(
    id: number,
    body: Record<string, unknown>,
    file: Express.Multer.File | undefined,
  ) {
    const { name, ...profileValues } = this.parseProfile(body);
    const removePhoto = body.removePhoto === 'true';
    const image = await this.preparePhoto(file, removePhoto);
    let createdFile: string | undefined;
    let previousPhoto: string | null | undefined;
    try {
      const updated = await this.sequelize.transaction(async (transaction) => {
        const user = await this.getUserForUpdate(id, transaction);

        if (name !== undefined) {
          await user.update({ name }, { transaction });
        }

        const profile = await this.getOrCreateProfile(id, transaction);
        if (image || removePhoto) {
          previousPhoto = profile.photo;
        }

        if (image) {
          const photo = this.createPhotoPaths(id);
          createdFile = photo.filePath;
          await this.writePhoto(photo, image);
          profileValues.photo = photo.url;
        } else if (removePhoto) {
          profileValues.photo = null;
        }
        await profile.update(profileValues, { transaction });
        return this.getProfileUser(id, transaction);
      });
      await this.removePreviousPhoto(id, previousPhoto);
      return updated;
    } catch (error) {
      await this.removeCreatedPhoto(createdFile);
      throw error;
    }
  }
}

export = new ProfileService(sequelize, User, UserProfile);
