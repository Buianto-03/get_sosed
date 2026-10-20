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

  async editProfile(id, body, file) {
    const values = this.parseProfile(body);
    if (file && body.removePhoto === 'true') throw invalid();
    let image;
    if (file) {
      if (file.size > 5 * 1024 * 1024) throw invalid();
      try {
        image = await sharp(file.buffer).webp().toBuffer();
      } catch {
        throw invalid();
      }
    }
    let createdFile;
    let previousPhoto;
    try {
      const updated = await this.sequelize.transaction(async (transaction) => {
        const user = await this.user.findByPk(id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!user)
          throw Object.assign(new Error('User not found'), {
            status: 404,
            code: 'USER_NOT_FOUND',
          });
        if (values.name !== undefined) {
          await user.update({ name: values.name }, { transaction });
          delete values.name;
        }
        const [profile] = await this.userProfile.findOrCreate({
          where: { userId: id },
          defaults: { photo: null },
          transaction,
        });
        if (image || body.removePhoto === 'true') previousPhoto = profile.photo;
        if (image) {
          const directory = `./public/images/users/user-${id}`;
          const name = `${randomUUID()}.webp`;
          createdFile = `${directory}/${name}`;
          await fs.mkdir(directory, { recursive: true });
          await fs.writeFile(createdFile, image);
          values.photo = `/images/users/user-${id}/${name}`;
        } else if (body.removePhoto === 'true') values.photo = null;
        await profile.update(values, { transaction });
        const updated = await this.user.findByPk(id, {
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
        return updated;
      });
      if (
        previousPhoto &&
        new RegExp(`^/images/users/user-${id}/[^/]+\\.webp$`).test(
          previousPhoto,
        )
      ) {
        await fs
          .rm(`./public${previousPhoto}`, { force: true })
          .catch((error) => {
            console.error('Cannot remove previous profile photo:', error);
          });
      }
      return updated;
    } catch (error) {
      if (createdFile)
        await fs.rm(createdFile, { force: true }).catch((error) => {
          console.error('Cannot remove profile photo after rollback:', error);
        });
      throw error;
    }
  }
}

module.exports = new ProfileService(sequelize, User, UserProfile);
