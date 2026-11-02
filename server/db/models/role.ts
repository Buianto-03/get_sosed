import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ModelStatic,
} from 'sequelize';
import commonAttributes = require('./commonAttributes');
const createRole = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class Role extends Model<
    InferAttributes<Role>,
    InferCreationAttributes<Role>
  > {
    declare id: CreationOptional<number>;
    declare name: string | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate({ User }: Record<string, ModelStatic<Model>>) {
      this.hasMany(User, { foreignKey: 'roleId' });
    }
  }
  Role.init(
    {
      ...commonAttributes(),
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Role',
    },
  );
  return Role;
};

export = createRole;
