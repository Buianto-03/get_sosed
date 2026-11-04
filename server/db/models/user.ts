import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
} from 'sequelize';
import type createUserProfile = require('./userprofile');
import type db = require('./index');
import commonAttributes = require('./commonAttributes');
const createUser = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class User extends Model<
    InferAttributes<User>,
    InferCreationAttributes<User>
  > {
    declare id: CreationOptional<number>;
    declare name: string | null;
    declare email: string | null;
    declare hashpass: string | null;
    declare roleId: number | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare UserProfile?: NonAttribute<
      InstanceType<ReturnType<typeof createUserProfile>> | null
    >;

    static associate({
      Role,
      UserProfile,
      Like,
      Advert,
      Chat,
      UserPhoto,
    }: Pick<
      typeof db,
      'Role' | 'UserProfile' | 'Like' | 'Advert' | 'Chat' | 'UserPhoto'
    >) {
      this.belongsTo(Role, { foreignKey: 'roleId' });
      this.hasOne(UserProfile, { foreignKey: 'userId' });
      this.hasMany(Like, { foreignKey: 'userId' });
      this.hasMany(Advert, { foreignKey: 'userId' });
      this.hasMany(Chat, { foreignKey: 'senderId', as: 'sentChats' });
      this.hasMany(Chat, { foreignKey: 'receiverId', as: 'receivedChats' });
      this.hasMany(UserPhoto, { foreignKey: 'userId' });
    }
  }
  User.init(
    {
      ...commonAttributes(),
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      hashpass: DataTypes.STRING,
      roleId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'User',
    },
  );
  return User;
};

export = createUser;
