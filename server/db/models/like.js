'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {

    static associate({ Advert, User, UserProfile }) {
      this.belongsTo(Advert, { foreignKey: 'advertId' });
      this.belongsTo(User, { foreignKey: 'userId' });
    }
  }
  Like.init({
    advertId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Like',
  });
  return Like;
};