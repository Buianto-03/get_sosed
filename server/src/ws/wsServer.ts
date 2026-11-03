import { WebSocketServer } from 'ws';

const wsServer = new WebSocketServer({
  clientTracking: false,
  noServer: true,
});

export = wsServer;
