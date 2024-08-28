'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdvertTags extends Model {

    static associate({Advert, Tags}) {
      this.belongsTo(Advert, { foreignKey: 'advertId' });
      this.belongsTo(Tags, { foreignKey: 'tagId' });
    }
  }
  AdvertTags.init({
    tagId: DataTypes.INTEGER,
    advertId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AdvertTags',
  });
  return AdvertTags;
};