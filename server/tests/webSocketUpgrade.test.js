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

test('WebSocket cookie formats and failures preserve upgrade authorization', (t) => {
  t.mock.method(console, 'log', () => {});
  const previousSecret = process.env.REFRESH_TOKEN_SECRET;
  process.env.REFRESH_TOKEN_SECRET = 'websocket-cookie-test-secret';
  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.REFRESH_TOKEN_SECRET;
    } else {
      process.env.REFRESH_TOKEN_SECRET = previousSecret;
    }
  });
  const user = { id: 7, name: 'Anna', extra: 'preserved' };
  const token = jwt.sign({ user }, process.env.REFRESH_TOKEN_SECRET);
  const expired = jwt.sign({ user, exp: 1 }, process.env.REFRESH_TOKEN_SECRET);
  let upgrades = 0;
  const connections = [];
  const ws = {};
  t.mock.method(wsServer, 'handleUpgrade', (request, socket, head, callback) => {
    upgrades += 1;
    callback(ws);
  });
  t.mock.method(wsServer, 'emit', (event, connectedWs, request, connectedUser) => {
    connections.push({ event, ws: connectedWs, request, user: connectedUser });
    return true;
  });
  const cases = [
    { cookie: `refreshToken=${token}`, success: true },
    { cookie: `refreshToken=%${token.charCodeAt(0).toString(16)}${token.slice(1)}`, success: true },
    { cookie: `refreshToken=${encodeURIComponent(`j:${JSON.stringify(token)}`)}`, success: true },
    { cookie: `refreshToken="${token}"`, success: true },
    { cookie: `other=value; refreshToken=${token}; another=ok`, success: true },
    { cookie: `refreshToken=${token}; refreshToken=invalid`, success: true },
    { cookie: `refreshToken=invalid; refreshToken=${token}` },
    { cookie: undefined },
    { cookie: '' },
    { cookie: 'refreshToken=' },
    { cookie: 'refreshToken=invalid' },
    { cookie: `refreshToken=${expired}` },
    { cookie: 'refreshToken=j%3A%7Bbroken' },
    { cookie: 'refreshToken=j%3A%7B%22id%22%3A7%7D' },
    { cookie: 'refreshToken=j%3A%5B1%2C2%5D' },
    { cookie: 'refreshToken=%E0%A4%A' },
    { cookie: `refreshToken=${token}`, url: '/other', status: 404 },
  ];
  for (const { cookie, success, url = '/ws', status = 401 } of cases) {
    const beforeUpgrades = upgrades;
    const beforeConnections = connections.length;
    const socket = new EventEmitter();
    socket.write = (data) => { socket.response = data; };
    socket.destroy = () => { socket.destroyed = true; };
    const request = { url, headers: cookie === undefined ? {} : { cookie } };
    upgrade(request, socket, Buffer.alloc(0));
    if (success) {
      assert.equal(upgrades, beforeUpgrades + 1);
      assert.equal(connections.length, beforeConnections + 1);
      assert.deepEqual(connections.at(-1), { event: 'connection', ws, request, user });
      assert.equal(socket.destroyed, undefined);
    } else {
      assert.equal(upgrades, beforeUpgrades);
      assert.equal(connections.length, beforeConnections);
      assert.equal(socket.response, `HTTP/1.1 ${status} ${status === 404 ? 'Not Found' : 'Unauthorized'}\r\n\r\n`);
      assert.equal(socket.destroyed, true);
    }
  }
});
