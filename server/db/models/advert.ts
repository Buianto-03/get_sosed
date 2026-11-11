import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createAdvert = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class Advert extends Model<
    InferAttributes<Advert>,
    InferCreationAttributes<Advert>
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
      AdvertPhoto,
      User,
      Location,
      AdvertTags,
      Like,
      Tags,
    }: Pick<
      typeof db,
      'AdvertPhoto' | 'User' | 'Location' | 'AdvertTags' | 'Like' | 'Tags'
    >) {
      // define association here
      this.hasMany(AdvertPhoto, { foreignKey: 'advertId' });
      this.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      this.hasOne(Location, { foreignKey: 'advertId', as: 'location' });
      this.hasMany(AdvertTags, { foreignKey: 'advertId', as: 'advertsTags' });
      this.hasMany(Like, { foreignKey: 'advertId' });
      this.belongsToMany(Tags, {
        through: AdvertTags,
        foreignKey: 'advertId',
        as: 'tags',
      });
    }
  }
  Advert.init(
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
      modelName: 'Advert',
    },
  );
  return Advert;
};

export = createAdvert;
