'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate({ User }) {
      this.belongsTo(User, { foreignKey: 'userId' });
    }
  }
  UserProfile.init(
    {
      userId: DataTypes.INTEGER,
      about: DataTypes.TEXT,
      city: DataTypes.STRING,
      intent: DataTypes.STRING,
      habits: { type: DataTypes.JSONB, defaultValue: [] },
      age: DataTypes.INTEGER,
      gender: DataTypes.STRING,
      photo: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'UserProfile',
    },
  );
  return UserProfile;
};
