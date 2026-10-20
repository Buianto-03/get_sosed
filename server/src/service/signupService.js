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

  async signup(body, file) {
    const { name, email, password, gender } = body;
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 9 ||
      !/\d/.test(password) ||
      (gender !== undefined && !['', 'male', 'female'].includes(gender))
    ) {
      throw signupError(400, 'INVALID_SIGNUP_DATA', 'Invalid signup data');
    }
    if (await this.user.findOne({ where: { email: email.trim() } })) {
      throw signupError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
    }
    // Decode the optional image before inserting anything into the database.
    let image;
    if (file) {
      try {
        image = await sharp(file.buffer).webp().toBuffer();
      } catch {
        throw signupError(400, 'INVALID_PHOTO', 'Invalid photo');
      }
    }
    const hashpass = await bcrypt.hash(password, 10);
    let photoPath;
    try {
      return await this.sequelize.transaction(async (transaction) => {
        const newUser = await this.user.create(
          { name: name.trim(), email: email.trim(), hashpass },
          { transaction },
        );
        let photo = null;
        if (image) {
          const directory = `./public/images/users/user-${newUser.id}`;
          photoPath = `${directory}/user-${newUser.id}.webp`;
          await fs.mkdir(directory, { recursive: true });
          await fs.writeFile(photoPath, image);
          photo = `/images/users/user-${newUser.id}/user-${newUser.id}.webp`;
        }
        await this.userProfile.create(
          { userId: newUser.id, gender: gender || null, photo },
          { transaction },
        );
        const result = await this.user.findByPk(newUser.id, {
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
      });
    } catch (error) {
      if (photoPath)
        await fs.rm(photoPath, { force: true }).catch((error) => {
          console.error('Cannot remove signup photo after rollback:', error);
        });
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw signupError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
      }
      throw error;
    }
  }
}

module.exports = new SignupService(sequelize, User, UserProfile);
