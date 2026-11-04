import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createAdvertTags = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class AdvertTags extends Model<
    InferAttributes<AdvertTags>,
    InferCreationAttributes<AdvertTags>
  > {
    declare tagId: number | null;
    declare advertId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({
      Advert,
      Tags,
    }: Pick<typeof db, 'Advert' | 'Tags'>) {
      this.belongsTo(Advert, { foreignKey: 'advertId' });
      this.belongsTo(Tags, { foreignKey: 'tagId' });
    }
  }
  AdvertTags.init(
    {
      ...commonAttributes(),
      tagId: DataTypes.INTEGER,
      advertId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'AdvertTags',
    },
  );
  return AdvertTags;
};

export = createAdvertTags;
