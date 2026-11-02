const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const upgrade = require('../build/src/ws/upgrade');

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
