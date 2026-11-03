import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ModelStatic,
} from 'sequelize';
import commonAttributes = require('./commonAttributes');
const createAdvertTags = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class AdvertTags extends Model<
    InferAttributes<AdvertTags>,
    InferCreationAttributes<AdvertTags>
  > {
    declare id: CreationOptional<number>;
    declare tagId: number | null;
    declare advertId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({ Advert, Tags }: Record<string, ModelStatic<Model>>) {
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
