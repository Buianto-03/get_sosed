import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ModelStatic,
} from 'sequelize';
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

    static associate({
      Advert,
      User,
      UserProfile,
    }: Record<string, ModelStatic<Model>>) {
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
