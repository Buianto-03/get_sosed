'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate({ Role, UserProfile, Like, Advert, Chat, UserPhoto }) {
      this.belongsTo(Role, { foreignKey: 'roleId' });
      this.hasOne(UserProfile, { foreignKey: 'userId' });
      this.hasMany(Like, { foreignKey: 'userId' });
      this.hasMany(Advert, { foreignKey: 'userId' });
      this.hasMany(Chat, { foreignKey: 'senderId', as: 'sentChats' });
      this.hasMany(Chat, { foreignKey: 'receiverId', as: 'receivedChats' });
      this.hasMany(UserPhoto, {foreignKey: 'userId'})
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      hashpass: DataTypes.STRING,
      roleId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'User',
    },
  );
  return User;
};
