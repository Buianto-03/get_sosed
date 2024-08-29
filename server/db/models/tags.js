'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tags extends Model {

    static associate({AdvertTags, Advert}) {
      this.hasMany(AdvertTags, {foreignKey: 'tagId', as: 'advertsTags'})
      this.belongsToMany(Advert, {through: AdvertTags, foreignKey: 'tagId', as: 'adverts'})
    }
  }
  Tags.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Tags',
  });
  return Tags;
};