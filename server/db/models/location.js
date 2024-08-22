'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Advert }) {
      this.belongsTo(Advert, { foreignKey: 'advertId' });
    }
  }
  Location.init(
    {
      city: DataTypes.STRING,
      district: DataTypes.STRING,
      address: DataTypes.STRING,
      metro: DataTypes.STRING,
      coordinates: DataTypes.STRING,
      advertId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Location',
    },
  );
  return Location;
};
