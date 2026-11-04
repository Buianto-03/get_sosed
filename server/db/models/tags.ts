import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createTags = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class Tags extends Model<
    InferAttributes<Tags>,
    InferCreationAttributes<Tags>
  > {
    declare id: CreationOptional<number>;
    declare name: string | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({
      AdvertTags,
      Advert,
    }: Pick<typeof db, 'AdvertTags' | 'Advert'>) {
      this.hasMany(AdvertTags, { foreignKey: 'tagId', as: 'advertsTags' });
      this.belongsToMany(Advert, {
        through: AdvertTags,
        foreignKey: 'tagId',
        as: 'adverts',
      });
    }
  }
  Tags.init(
    {
      ...commonAttributes(),
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Tags',
    },
  );
  return Tags;
};

export = createTags;
