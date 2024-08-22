'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdvertPhoto extends Model {
    static associate({Advert}) {
      // define association here
      this.belongsTo(Advert, {foreignKey: 'advertId'})
    }
  }
  AdvertPhoto.init({
    advertId: DataTypes.INTEGER,
    photo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AdvertPhoto',
  });
  return AdvertPhoto;
};