const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const tokensRouter = require('./router/tokensRouter');
const authRouter = require('./router/authRouter');
const advertRouter = require('./router/advertRouter');
const userRouter = require('./router/userRouter');
const upgradeCb = require('./ws/upgrade');
const wsServer = require('./ws/wsServer');
const connection = require('./ws/connection');
const likeRouter = require('./router/likeRouter');

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
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
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://api-maps.yandex.ru',
    changeOrigin: true,
    pathRewrite: {
      '/api': '', // remove base path
    },
  }),
);

const server = createServer(app);

server.on('upgrade', upgradeCb);
wsServer.on('connection', connection);

module.exports = server;
