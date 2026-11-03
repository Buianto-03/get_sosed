const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');
const upgrade = require('../build/src/ws/upgrade');
const wsServer = require('../build/src/ws/wsServer');

test('WebSocket upgrades without a token return a valid HTTP 401 response', () => {
  const socket = new EventEmitter();
  socket.write = (data) => {
    socket.response = data;
  };
  socket.destroy = () => {
    socket.destroyed = true;
  };

  upgrade({ url: '/ws', headers: {} }, socket, Buffer.alloc(0));

  assert.equal(socket.response, 'HTTP/1.1 401 Unauthorized\r\n\r\n');
  assert.equal(socket.destroyed, true);
});

test('WebSocket authorization validates token users before upgrading and preserves session fields', (t) => {
  t.mock.method(console, 'log', () => {});
  const previousSecret = process.env.REFRESH_TOKEN_SECRET;
  process.env.REFRESH_TOKEN_SECRET = 'websocket-payload-secret';
  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.REFRESH_TOKEN_SECRET;
    } else {
      process.env.REFRESH_TOKEN_SECRET = previousSecret;
    }
  });
  const connectedUsers = [];
  t.mock.method(wsServer, 'handleUpgrade', (request, socket, head, callback) => {
    callback({});
  });
  t.mock.method(wsServer, 'emit', (event, ws, request, user) => {
    assert.equal(event, 'connection');
    connectedUsers.push(user);
    return true;
  });

  for (const user of [undefined, null, {}, { id: '7' }, { id: 0 }, { id: 7, name: [] }]) {
    const token = jwt.sign({ user }, process.env.REFRESH_TOKEN_SECRET);
    const socket = new EventEmitter();
    socket.write = (data) => { socket.response = data; };
    socket.destroy = () => { socket.destroyed = true; };
    upgrade({ url: '/ws', headers: { cookie: `refreshToken=${token}` } }, socket, Buffer.alloc(0));
    assert.equal(socket.response, 'HTTP/1.1 401 Unauthorized\r\n\r\n');
    assert.equal(socket.destroyed, true);
  }
  assert.equal(connectedUsers.length, 0);

  const user = { id: 7, name: 'Anna', email: 'anna@example.com' };
  const token = jwt.sign({ user }, process.env.REFRESH_TOKEN_SECRET);
  const socket = new EventEmitter();
  socket.write = () => { assert.fail('Unexpected error response'); };
  socket.destroy = () => { assert.fail('Unexpected socket close'); };
  upgrade({ url: '/ws', headers: { cookie: `refreshToken=${token}` } }, socket, Buffer.alloc(0));
  assert.deepEqual(connectedUsers, [user]);
});
