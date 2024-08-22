'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Advert extends Model {
    static associate({AdvertPhoto}) {
      // define association here
      this.hasMany(AdvertPhoto, {foreignKey: 'advertId'})
    }
  }
  Advert.init({
    title: DataTypes.STRING,
    body: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    price: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Advert',
  });
  return Advert;
};