import type { IncomingMessage } from 'node:http';
import type WebSocket from 'ws';
import type { AuthUser } from '../types/auth';
import chatService = require('../service/chatService');

interface ChatAction {
  type?: string;
  payload?: { receiverId?: unknown; text?: unknown };
}

const connections = new Map<WebSocket, { ws: WebSocket; user: AuthUser }>();

const send = (socket: WebSocket, action: object) => {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(action));
  }
};

const broadcastOnline = () => {
  const payload = [...connections.values()].map(({ user }) => ({
    id: user.id,
    name: user.name,
  }));
  connections.forEach(({ ws }) => send(ws, { type: 'SET_USERS', payload }));
};

const connect = (
  socket: WebSocket,
  request: IncomingMessage,
  user: AuthUser,
) => {
  // Multiple browser tabs for one user can stay connected independently.
  const key = socket;
  connections.set(key, { ws: socket, user });
  broadcastOnline();
  socket.on('message', async (raw) => {
    let receiverId = 0;
    try {
      const { type, payload } = JSON.parse(raw.toString()) as ChatAction;
      receiverId = Number(payload?.receiverId);

      if (type === 'INITIALIZE') {
        const messages = await chatService.getMessages(user.id, receiverId);
        send(socket, { type: 'SET_MESSAGES', receiverId, payload: messages });
      } else if (type === 'ADD_MESSAGE') {
        const message = await chatService.sendMessage(
          user.id,
          receiverId,
          payload!.text,
        );
        connections.forEach((connection) => {
          if ([user.id, receiverId].includes(connection.user.id)) {
            send(connection.ws, { type: 'ADD_MESSAGE', payload: message });
          }
        });
      }
    } catch (error) {
      console.error('Cannot process chat request:', error);
      send(socket, {
        type: 'CHAT_ERROR',
        receiverId,
        payload: 'Не удалось выполнить запрос чата.',
      });
    }
  });
  const cleanup = () => {
    connections.delete(key);
    broadcastOnline();
  };
  socket.on('close', cleanup);
  socket.on('error', cleanup);
};

export = connect;
