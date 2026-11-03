import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ModelStatic,
  type NonAttribute,
} from 'sequelize';
import type createUser = require('./user');
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
    declare advertId: number | null;
    declare userId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare User?: NonAttribute<InstanceType<
      ReturnType<typeof createUser>
    > | null>;

    static associate({ Advert, User }: Record<string, ModelStatic<Model>>) {
      this.belongsTo(Advert, { foreignKey: 'advertId' });
      this.belongsTo(User, { foreignKey: 'userId' });
    }
  }
  Like.init(
    {
      ...commonAttributes(),
      advertId: DataTypes.INTEGER,
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
