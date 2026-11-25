import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createListing = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class Listing extends Model<
    InferAttributes<Listing>,
    InferCreationAttributes<Listing>
  > {
    declare id: CreationOptional<number>;
    declare title: string | null;
    declare body: string | null;
    declare userId: number | null;
    declare price: number | null;
    declare floor: number | null;
    declare square: number | null;
    declare rooms: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({
      ListingPhoto,
      User,
      Location,
      ListingTags,
      Like,
      Tags,
    }: Pick<
      typeof db,
      'ListingPhoto' | 'User' | 'Location' | 'ListingTags' | 'Like' | 'Tags'
    >) {
      // define association here
      this.hasMany(ListingPhoto, { foreignKey: 'listingId', as: 'photos' });
      this.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      this.hasOne(Location, { foreignKey: 'listingId', as: 'location' });
      this.hasMany(ListingTags, { foreignKey: 'listingId', as: 'listingTags' });
      this.hasMany(Like, { foreignKey: 'listingId', as: 'likes' });
      this.belongsToMany(Tags, {
        through: ListingTags,
        foreignKey: 'listingId',
        as: 'tags',
      });
    }
  }
  Listing.init(
    {
      ...commonAttributes(),
      title: DataTypes.STRING,
      body: DataTypes.TEXT,
      userId: DataTypes.INTEGER,
      price: DataTypes.INTEGER,
      floor: DataTypes.INTEGER,
      square: DataTypes.INTEGER,
      rooms: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Listing',
      tableName: 'Listings',
    },
  );
  return Listing;
};

export = createListing;
