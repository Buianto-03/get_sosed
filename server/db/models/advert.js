'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Advert extends Model {
    static associate({AdvertPhoto, User, Location, AdvertTags, Like, Tags}) {
      // define association here
      this.hasMany(AdvertPhoto, {foreignKey: 'advertId'})
      this.belongsTo(User, {foreignKey: 'userId'})
      this.hasOne(Location, {foreignKey: 'advertId'})
      this.hasMany(AdvertTags, {foreignKey: 'advertId', as: 'advertsTags'})
      this.hasMany(Like, {foreignKey: 'advertId'})
      this.belongsToMany(Tags, {through: AdvertTags, foreignKey: 'advertId', as: 'tags'})
    }
  }
  Advert.init({
    title: DataTypes.STRING,
    body: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    floor: DataTypes.INTEGER,
    square: DataTypes.INTEGER,
    rooms: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Advert',
  });
  return Advert;
};