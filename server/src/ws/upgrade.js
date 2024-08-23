const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const wsServer = require('./wsServer');
require('dotenv').config();

const upgradeCb = (request, socket, head) => {
  socket.on('error', (err) => {
    console.log('Socket error:', err);
  });

  console.log('Parsing token from request...');
  cookieParser()(request, {}, () => {
    try {
      const { refreshToken } = request.cookies;
      const { user } = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );
      if (!user) throw new Error('Нет юзера в куки');

      console.log('JWT is parsed!');

      socket.removeListener('error', (err) => {
        console.log('Socket error:', err);
      });

      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request, user);
      });
    } catch (error) {
      socket.write('HTTP/1.1 401 Unauthorized\n\n');
      socket.destroy();
    }
  });
};

module.exports = upgradeCb;
