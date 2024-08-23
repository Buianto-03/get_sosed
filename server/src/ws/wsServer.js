const { WebSocketServer } = require('ws');

const wsServer = new WebSocketServer({
    clientTracking: false,
    noServer: true,
  });

  module.exports = wsServer;