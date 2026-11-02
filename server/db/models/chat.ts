import {
  Model,
  type Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ModelStatic,
} from 'sequelize';
import commonAttributes = require('./commonAttributes');

const createChat = (
  sequelize: Sequelize,
  DataTypes: typeof import('sequelize').DataTypes,
) => {
  class Chat extends Model<
    InferAttributes<Chat>,
    InferCreationAttributes<Chat>
  > {
    declare id: CreationOptional<number>;
    declare senderId: number;
    declare receiverId: number;
    declare message: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User }: Record<string, ModelStatic<Model>>) {
      this.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
      this.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
    }
  }
  Chat.init(
    {
      ...commonAttributes(),
      senderId: DataTypes.INTEGER,
      receiverId: DataTypes.INTEGER,
      message: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Chat',
    },
  );
  return Chat;
};

export = createChat;
