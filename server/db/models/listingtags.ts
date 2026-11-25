import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createListingTags = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class ListingTags extends Model<
    InferAttributes<ListingTags>,
    InferCreationAttributes<ListingTags>
  > {
    declare tagId: number | null;
    declare listingId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({
      Listing,
      Tags,
    }: Pick<typeof db, 'Listing' | 'Tags'>) {
      this.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
      this.belongsTo(Tags, { foreignKey: 'tagId' });
    }
  }
  ListingTags.init(
    {
      ...commonAttributes(),
      tagId: DataTypes.INTEGER,
      listingId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'ListingTags',
      tableName: 'ListingTags',
    },
  );
  return ListingTags;
};

export = createListingTags;
