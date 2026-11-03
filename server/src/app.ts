import express = require('express');
import morgan = require('morgan');
import path = require('path');
import { createServer } from 'http';
import cookieParser = require('cookie-parser');
import cors = require('cors');

import tokensRouter = require('./router/tokensRouter');
import authRouter = require('./router/authRouter');
import advertRouter = require('./router/advertRouter');
import userRouter = require('./router/userRouter');
import upgradeCb = require('./ws/upgrade');
import wsServer = require('./ws/wsServer');
import connection = require('./ws/connection');
import likeRouter = require('./router/likeRouter');

const app = express();
const serverRoot = process.cwd();

app.use(cors());
app.use(express.static(path.join(serverRoot, 'public')));
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/adverts', advertRouter);
app.use('/api/users', userRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/auth', authRouter);
app.use('/api/likes', likeRouter);
// Unknown infrastructure URLs must never receive the SPA document.
app.use('/api', (req, res) =>
  res
    .status(404)
    .json({ code: 'API_ROUTE_NOT_FOUND', message: 'API route not found' }),
);
app.use('/images', (req, res) => res.sendStatus(404));
app.use('/ws', (req, res) => res.sendStatus(426));

app.use(express.static(path.join(serverRoot, 'dist')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(serverRoot, 'dist', 'index.html'));
});

const server = createServer(app);

server.on('upgrade', upgradeCb);
wsServer.on('connection', connection);

export = server;
