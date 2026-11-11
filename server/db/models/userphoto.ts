import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createUserPhoto = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class UserPhoto extends Model<
    InferAttributes<UserPhoto>,
    InferCreationAttributes<UserPhoto>
  > {
    declare id: CreationOptional<number>;
    declare photo: string | null;
    declare userId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User }: Pick<typeof db, 'User'>) {
      this.belongsTo(User, { foreignKey: 'userId' });
      // define association here
    }
  }
  UserPhoto.init(
    {
      ...commonAttributes(),
      photo: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'UserPhoto',
    },
  );
  return UserPhoto;
};

export = createUserPhoto;
