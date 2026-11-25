import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
} from 'sequelize';
import type createUser = require('./user');
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createLike = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class Like extends Model<
    InferAttributes<Like>,
    InferCreationAttributes<Like>
  > {
    declare id: CreationOptional<number>;
    declare listingId: number | null;
    declare userId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare User?: NonAttribute<InstanceType<
      ReturnType<typeof createUser>
    > | null>;

    static associate({
      Listing,
      User,
    }: Pick<typeof db, 'Listing' | 'User'>) {
      this.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
      this.belongsTo(User, { foreignKey: 'userId' });
    }
  }
  Like.init(
    {
      ...commonAttributes(),
      listingId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Like',
    },
  );
  return Like;
};

export = createLike;
