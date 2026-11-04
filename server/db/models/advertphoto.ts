import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createAdvertPhoto = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class AdvertPhoto extends Model<
    InferAttributes<AdvertPhoto>,
    InferCreationAttributes<AdvertPhoto>
  > {
    declare id: CreationOptional<number>;
    declare advertId: number | null;
    declare photo: string | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({ Advert }: Pick<typeof db, 'Advert'>) {
      // define association here
      this.belongsTo(Advert, { foreignKey: 'advertId' });
    }
  }
  AdvertPhoto.init(
    {
      ...commonAttributes(),
      advertId: DataTypes.INTEGER,
      photo: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'AdvertPhoto',
    },
  );
  return AdvertPhoto;
};

export = createAdvertPhoto;
