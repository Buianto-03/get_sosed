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
      ListingTags,
      Listing,
    }: Pick<typeof db, 'ListingTags' | 'Listing'>) {
      this.hasMany(ListingTags, { foreignKey: 'tagId', as: 'listingTags' });
      this.belongsToMany(Listing, {
        through: ListingTags,
        foreignKey: 'tagId',
        as: 'listings',
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
