const { Chat, User } = require('../../db/models');
const { Op } = require('sequelize');

const connections = new Map(); // in-memory DB

const connectionCb = async (socket, request, user) => {
  connections.set(user.id, { ws: socket, user, receiverId: null });

  connections.forEach(async (connection) => {
    const { ws } = connection;
    const allUsers = [...connections.values()].map(({ user: u }) => u);

    const action = {
      type: 'SET_USERS',
      payload: allUsers,
    };
    ws.send(JSON.stringify(action));

    // console.log(connections);
  });

  // Получаем receiverId из запроса

  // Поиск сообщений только между текущим пользователем и получателем

  socket.on('message', async (data) => {
    const { type, payload } = JSON.parse(data);
    // console.log({userId: user.id, receiverId, payload, getUser: connections.get(user.id), type})

    switch (type) {
      case 'INITIALIZE':
        // Устанавливаем receiverId для текущего пользователя
        connections.get(user.id).receiverId = payload.receiverId;
        
        // Выполняем запрос на получение сообщений между пользователями
        const allMessages = await Chat.findAll({
          where: {
            [Op.or]: [
              { senderId: user.id, receiverId: payload.receiverId },
              { senderId: payload.receiverId, receiverId: user.id },
            ],
          },
          include: [
            { model: User, as: 'sender' },
            { model: User, as: 'receiver' },
          ],
        });

        const senderConnection = connections.get(user.id);

        // Отправляем сообщения только текущему пользователю
        socket.send(
          JSON.stringify({ type: 'SET_MESSAGES', payload: allMessages }),
        );
        break;

      case 'SEND_MESSAGE':
        // Отправляем сообщение конкретному пользователю
        const receiverConnection = connections.get(payload.receiverId);
        if (receiverConnection) {
          // Сохраните сообщение в базе данных
          const newMessage = await Chat.create({
            senderId: user.id,
            receiverId: payload.receiverId,
            message: payload.message,
          });

          // Отправляем сообщение как отправителю, так и получателю
          const messagePayload = JSON.stringify({
            type: 'NEW_MESSAGE',
            payload: newMessage,
          });

          // Отправка отправителю
          socket.send(messagePayload);

          // Отправка получателю
          receiverConnection.ws.send(messagePayload);
        } else {
          console.log('Пользователь не в сети');
        }
        break;

      default:
        break;
    }
  });

  socket.on('close', () => {
    connections.delete(user.id);
    connections.forEach((connection) => {
      const { ws } = connection;
      const allUsers = [...connections.values()].map(({ user: u }) => u);
      const action = {
        type: 'SET_USERS',
        payload: allUsers,
      };
      ws.send(JSON.stringify(action));
    });
  });

  socket.on('error', () => {
    connections.delete(user.id);
    connections.forEach((connection) => {
      const { ws } = connection;
      const allUsers = [...connections.values()].map(({ user: u }) => u);
      const action = {
        type: 'SET_USERS',
        payload: allUsers,
      };
      ws.send(JSON.stringify(action));
    });
  });

  socket.on('message', async (message) => {
    const actionFromFront = JSON.parse(message);
    const { type, payload } = actionFromFront;
    
    switch (type) {
      case 'ADD_MESSAGE':
        {
          // console.log('receiver ====>', typeof Number(payload.receiverId));

          const newMessage = await Chat.create({
            message: payload.text,
            senderId: user.id,
            receiverId: Number(payload.receiverId),
          });

          const newMessageWithUser = await Chat.findOne({
            where: { id: newMessage.id },
            include: [
              { model: User, as: 'sender' },
              { model: User, as: 'receiver' },
            ],
          });

          const action = {
            type: 'ADD_MESSAGE',
            payload: newMessageWithUser,
          };

          console.log('Sending to sender:', connections.get(user.id));
          connections.get(user.id).ws.send(JSON.stringify(action)); // Отправка сообщения отправителю

          console.log(
            'Sending to receiver:',
            connections.get(Number(payload.receiverId)),
          );
          if (connections.has(Number(payload.receiverId))) {
            connections
              .get(Number(payload.receiverId))
              .ws.send(JSON.stringify(action)); // Отправка сообщения получателю
          } else {
            console.error(
              `Receiver with ID ${payload.receiverId} is not connected`,
            );
          }
        }
        break;

      default:
        break;
    }
  });

  //   const userId = request.session.user.id;

  //   map.set(userId, { ws: socket, user: request.session.user });

  //   function sendUsers(activeConnections) {
  //     activeConnections.forEach(({ ws }) => {
  //       ws.send(
  //         JSON.stringify({
  //           type: 'SET_USERS',
  //           payload: [...map.values()].map(({ user }) => user),
  //         }),
  //       );
  //     });
  //   }

  //   sendUsers(map);

  //     const actionFromFront = JSON.parse(message);
  //     const { type, payload } = actionFromFront;
  //     switch (type) {
  //       case SEND_MESSAGE:
  //         Message.create({ text: payload, authorId: userId }).then(async (newMessage) => {
  //           const newMessageWithAuthor = await Message.findOne({
  //             where: { id: newMessage.id },
  //             include: User,
  //           });
  //           map.forEach(({ ws }) => {
  //             ws.send(
  //               JSON.stringify({
  //                 type: ADD_MESSAGE,
  //                 payload: newMessageWithAuthor,
  //               }),
  //             );
  //           });
  //         });
  //         break;

  //       case DELETE_MESSAGE:
  //         Message.findOne({ where: { id: payload } }).then(async (targetMessage) => {
  //           if (targetMessage.authorId !== userId) return;
  //           await Message.destroy({ where: { id: payload } });
  //           map.forEach(({ ws }) => {
  //             ws.send(
  //               JSON.stringify({
  //                 type: HIDE_MESSAGE,
  //                 payload,
  //               }),
  //             );
  //           });
  //         });
  //         break;

  //       default:
  //         break;
  //     }
  //     console.log(`Received message ${message} from user ${userId}`);
  //   });

  //   socket.on('close', () => {
  //     map.delete(userId);
  //     sendUsers(map);
  //   });
};

module.exports = connectionCb;
