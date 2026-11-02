import Sequelize = require('sequelize');
import createAdvert = require('./advert');
import createAdvertPhoto = require('./advertphoto');
import createAdvertTags = require('./adverttags');
import createChat = require('./chat');
import createLike = require('./like');
import createLocation = require('./location');
import createRole = require('./role');
import createTags = require('./tags');
import createUser = require('./user');
import createUserPhoto = require('./userphoto');
import createUserProfile = require('./userprofile');

interface DatabaseConfig extends Sequelize.Options {
  use_env_variable?: string;
  database: string;
  username: string;
  password: string;
}

const env = process.env.NODE_ENV || 'development';
const config: DatabaseConfig = require('../../config/database.js')[env];
const sequelize = config.use_env_variable
  ? new Sequelize.Sequelize(process.env[config.use_env_variable]!, config)
  : new Sequelize.Sequelize(
      config.database,
      config.username,
      config.password,
      config,
    );

const models = {
  Advert: createAdvert(sequelize, Sequelize.DataTypes),
  AdvertPhoto: createAdvertPhoto(sequelize, Sequelize.DataTypes),
  AdvertTags: createAdvertTags(sequelize, Sequelize.DataTypes),
  Chat: createChat(sequelize, Sequelize.DataTypes),
  Like: createLike(sequelize, Sequelize.DataTypes),
  Location: createLocation(sequelize, Sequelize.DataTypes),
  Role: createRole(sequelize, Sequelize.DataTypes),
  Tags: createTags(sequelize, Sequelize.DataTypes),
  User: createUser(sequelize, Sequelize.DataTypes),
  UserPhoto: createUserPhoto(sequelize, Sequelize.DataTypes),
  UserProfile: createUserProfile(sequelize, Sequelize.DataTypes),
};

for (const model of Object.values(models)) {
  model.associate(models);
}

export = { ...models, sequelize, Sequelize };
