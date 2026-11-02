import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import type { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import cookieParser = require('cookie-parser');
import jwt = require('jsonwebtoken');
import wsServer = require('./wsServer');

require('dotenv').config();

const upgradeCb = (request: IncomingMessage, socket: Duplex, head: Buffer) => {
  if (request.url?.split('?')[0] !== '/ws') {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }
  socket.on('error', (err) => {
    console.log('Socket error:', err);
  });

  console.log('Parsing token from request...');
  cookieParser()(request as Request, {} as Response, () => {
    try {
      const { refreshToken } = (request as Request).cookies;
      const { user } = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
      ) as jwt.JwtPayload;
      if (!user) {
        throw new Error('Нет юзера в куки');
      }

      console.log('JWT is parsed!');

      socket.removeListener('error', (err) => {
        console.log('Socket error:', err);
      });

      wsServer.handleUpgrade(request, socket, head, (ws) => {
        (wsServer as EventEmitter).emit('connection', ws, request, user);
      });
    } catch (error) {
      console.log('ERR', error);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });
};

export = upgradeCb;
