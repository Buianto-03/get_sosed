import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createListingPhoto = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class ListingPhoto extends Model<
    InferAttributes<ListingPhoto>,
    InferCreationAttributes<ListingPhoto>
  > {
    declare id: CreationOptional<number>;
    declare listingId: number | null;
    declare photo: string | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({ Listing }: Pick<typeof db, 'Listing'>) {
      // define association here
      this.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
    }
  }
  ListingPhoto.init(
    {
      ...commonAttributes(),
      listingId: DataTypes.INTEGER,
      photo: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'ListingPhoto',
      tableName: 'ListingPhotos',
    },
  );
  return ListingPhoto;
};

export = createListingPhoto;
