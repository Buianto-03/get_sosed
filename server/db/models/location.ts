import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createLocation = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class Location extends Model<
    InferAttributes<Location>,
    InferCreationAttributes<Location>
  > {
    declare id: CreationOptional<number>;
    declare city: string | null;
    declare district: string | null;
    declare address: string | null;
    declare metro: string | null;
    declare coordinates: string | null;
    declare advertId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Advert }: Pick<typeof db, 'Advert'>) {
      this.belongsTo(Advert, { foreignKey: 'advertId' });
    }
  }
  Location.init(
    {
      ...commonAttributes(),
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

export = createLocation;
