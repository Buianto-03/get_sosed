const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const sharp = require('sharp');
const { sequelize, User, UserProfile } = require('../../db/models');
const invalid = () =>
  Object.assign(new Error('Invalid profile data'), {
    status: 400,
    code: 'INVALID_PROFILE_DATA',
  });

class ProfileService {
  constructor(sequelize, user, userProfile) {
    this.sequelize = sequelize;
    this.user = user;
    this.userProfile = userProfile;
  }

  parseProfile(body) {
    const values = {};
    const limits = {
      name: 100,
      about: 500,
      city: 100,
      intent: 255,
      phoneNumber: 32,
      gender: 30,
    };

    for (const [field, limit] of Object.entries(limits)) {
      if (body[field] === undefined) continue;
      if (typeof body[field] !== 'string' || body[field].trim().length > limit)
        throw invalid();
      if (field === 'name' && body[field].trim().length < 2) throw invalid();
      if (
        field === 'phoneNumber' &&
        body[field] &&
        !/^[+\d ()-]{5,32}$/.test(body[field])
      )
        throw invalid();
      values[field] = body[field].trim() || null;
    }

    if (body.age !== undefined) {
      const age = body.age === '' ? null : Number(body.age);
      if (age !== null && (!Number.isInteger(age) || age < 18 || age > 120)) {
        throw invalid();
      }
      values.age = age;
    }

    if (body.habits !== undefined) {
      let habits;
      try {
        habits = JSON.parse(body.habits);
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
      !['true', 'false'].includes(body.removePhoto)
    )
      throw invalid();
    return values;
  }

  async preparePhoto(file, removePhoto) {
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

  async getUserForUpdate(id, transaction) {
    const user = await this.user.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) {
      throw Object.assign(new Error('User not found'), {
        status: 404,
        code: 'USER_NOT_FOUND',
      });
    }
    return user;
  }

  async getOrCreateProfile(id, transaction) {
    const [profile] = await this.userProfile.findOrCreate({
      where: { userId: id },
      defaults: { photo: null },
      transaction,
    });
    return profile;
  }

  getProfileUser(id, transaction) {
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

  createPhotoPaths(id) {
    const directory = `./public/images/users/user-${id}`;
    const fileName = `${randomUUID()}.webp`;
    return {
      directory,
      filePath: `${directory}/${fileName}`,
      url: `/images/users/user-${id}/${fileName}`,
    };
  }

  async writePhoto({ directory, filePath }, image) {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, image);
  }

  async removePreviousPhoto(id, photoUrl) {
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

  async removeCreatedPhoto(filePath) {
    if (!filePath) {
      return;
    }
    try {
      await fs.rm(filePath, { force: true });
    } catch (error) {
      console.error('Cannot remove profile photo after rollback:', error);
    }
  }

  async editProfile(id, body, file) {
    const { name, ...profileValues } = this.parseProfile(body);
    const removePhoto = body.removePhoto === 'true';
    const image = await this.preparePhoto(file, removePhoto);
    let createdFile;
    let previousPhoto;
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

module.exports = new ProfileService(sequelize, User, UserProfile);
