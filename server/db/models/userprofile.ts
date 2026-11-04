import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createUserProfile = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class UserProfile extends Model<
    InferAttributes<UserProfile>,
    InferCreationAttributes<UserProfile>
  > {
    declare id: CreationOptional<number>;
    declare userId: number | null;
    declare about: string | null;
    declare city: string | null;
    declare intent: string | null;
    declare habits: CreationOptional<string[] | null>;
    declare age: number | null;
    declare gender: string | null;
    declare photo: string | null;
    declare phoneNumber: string | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({ User }: Pick<typeof db, 'User'>) {
      this.belongsTo(User, { foreignKey: 'userId' });
    }
  }
  UserProfile.init(
    {
      ...commonAttributes(),
      userId: DataTypes.INTEGER,
      about: DataTypes.TEXT,
      city: DataTypes.STRING,
      intent: DataTypes.STRING,
      habits: { type: DataTypes.JSONB, defaultValue: [] },
      age: DataTypes.INTEGER,
      gender: DataTypes.STRING,
      photo: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'UserProfile',
    },
  );
  return UserProfile;
};

export = createUserProfile;
