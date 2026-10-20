const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Op } = require('sequelize');

function load(file, dependencies, logs = []) {
  const filename = path.resolve(__dirname, file);
  const sandbox = {
    module: { exports: {} },
    require(name) {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
    console: { error: (...args) => logs.push(args) },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}

const exported = load('../src/service/chatService.js', {
  sequelize: { Op },
  '../../db/models': {},
});

function createService(chat = {}, user = { findByPk: async () => ({ id: 2 }) }) {
  return new exported.constructor(chat, user, {});
}

function checkParticipants(options, service) {
  assert.deepEqual(Array.from(options.include, (include) => include.as), ['sender', 'receiver']);
  for (const include of options.include) {
    assert.equal(include.model, service.user);
    assert.deepEqual(Array.from(include.attributes), ['id', 'name']);
    assert.equal(include.include[0].model, service.userProfile);
    assert.deepEqual(Array.from(include.include[0].attributes), ['photo']);
  }
}

test('chat service rejects invalid, self and missing receivers before reading or writing messages', async () => {
  const service = createService({}, { findByPk: async () => null });
  for (const receiverId of [0, -1, 1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1, '2']) {
    await assert.rejects(service.getMessages(1, receiverId), /Invalid receiver/);
    await assert.rejects(service.sendMessage(1, receiverId, 'Hello'), /Invalid receiver/);
  }
  await assert.rejects(service.getMessages(1, 2), /User not found/);
  await assert.rejects(service.sendMessage(1, 2, 'Hello'), /User not found/);
});

test('chat history is scoped to both directions of one conversation and selects safe participant fields', async () => {
  const messages = [{ id: 4, senderId: 1, receiverId: 2, message: 'Hello' }];
  const service = createService({
    findAll: async (options) => {
      assert.equal(JSON.stringify(options.where[Op.or]), JSON.stringify([
        { senderId: 1, receiverId: 2 },
        { senderId: 2, receiverId: 1 },
      ]));
      assert.equal(JSON.stringify(options.order), JSON.stringify([['id', 'ASC']]));
      checkParticipants(options, service);
      return messages;
    },
  });
  assert.equal(await service.getMessages(1, 2), messages);
});

test('chat service validates text before creating a message', async () => {
  const service = createService();
  for (const text of [undefined, null, 42, '', '   ', 'a'.repeat(10001)]) {
    await assert.rejects(service.sendMessage(1, 2, text), /Invalid message/);
  }
});

test('chat service saves a trimmed message and returns it with safe participant fields', async () => {
  const message = { id: 5, senderId: 1, receiverId: 2, message: 'Hello' };
  const writes = [];
  const service = createService({
    create: async (values) => {
      writes.push({ ...values });
      return { id: message.id };
    },
    findByPk: async (id, options) => {
      assert.equal(id, message.id);
      checkParticipants(options, service);
      return message;
    },
  });
  assert.equal(await service.sendMessage(1, 2, ' Hello '), message);
  assert.deepEqual(writes, [{ senderId: 1, receiverId: 2, message: 'Hello' }]);
});

test('chat service preserves database errors from recipient lookup, history, creation and reread', async () => {
  const failure = new Error('database unavailable');
  const reject = async () => { throw failure; };
  const services = [
    createService({}, { findByPk: reject }),
    createService({ findAll: reject }),
    createService({ create: reject }),
    createService({ create: async () => ({ id: 5 }), findByPk: reject }),
  ];
  await assert.rejects(services[0].getMessages(1, 2), (error) => error === failure);
  await assert.rejects(services[1].getMessages(1, 2), (error) => error === failure);
  await assert.rejects(services[2].sendMessage(1, 2, 'Hello'), (error) => error === failure);
  await assert.rejects(services[3].sendMessage(1, 2, 'Hello'), (error) => error === failure);
});

class FakeSocket {
  constructor() {
    this.readyState = 1;
    this.events = [];
    this.handlers = new Map();
  }

  send(value) {
    this.events.push(JSON.parse(value));
  }

  on(name, handler) {
    this.handlers.set(name, handler);
  }

  async receive(action) {
    await this.handlers.get('message')(Buffer.from(JSON.stringify(action)));
  }

  close() {
    this.readyState = 3;
    this.handlers.get('close')();
  }
}

test('WebSocket history passes authenticated user ID and returns SET_MESSAGES only to the requesting tab', async () => {
  const messages = [{ id: 5, senderId: 1, receiverId: 2, message: 'Hello' }];
  const calls = [];
  const connect = load('../src/ws/connection.js', {
    '../service/chatService': { getMessages: async (...args) => {
      calls.push(args);
      return messages;
    } },
  });
  const sender = new FakeSocket();
  const receiver = new FakeSocket();
  connect(sender, {}, { id: 1, name: 'Anna' });
  connect(receiver, {}, { id: 2, name: 'Boris' });
  sender.events.length = 0;
  receiver.events.length = 0;
  await sender.receive({ type: 'INITIALIZE', payload: { receiverId: '2', senderId: 999 } });
  assert.deepEqual(calls, [[1, 2]]);
  assert.deepEqual(sender.events, [{ type: 'SET_MESSAGES', receiverId: 2, payload: messages }]);
  assert.deepEqual(receiver.events, []);
});

test('WebSocket messages reach all participant tabs, support an offline receiver and preserve reconnect history', async () => {
  const messages = [];
  const connect = load('../src/ws/connection.js', {
    '../service/chatService': {
      sendMessage: async (senderId, receiverId, text) => {
        const message = { id: messages.length + 1, senderId, receiverId, message: text };
        messages.push(message);
        return message;
      },
      getMessages: async () => messages,
    },
  });
  const sockets = [1, 1, 2, 2, 3].map((id) => {
    const socket = new FakeSocket();
    connect(socket, {}, { id, name: `User ${id}` });
    return socket;
  });
  sockets.forEach((socket) => { socket.events.length = 0; });
  await sockets[0].receive({ type: 'ADD_MESSAGE', payload: { receiverId: 2, text: 'Hello', senderId: 999 } });
  for (const socket of sockets.slice(0, 4)) {
    assert.deepEqual(socket.events, [{ type: 'ADD_MESSAGE', payload: messages[0] }]);
  }
  assert.deepEqual(sockets[4].events, []);
  assert.equal(messages[0].senderId, 1);
  sockets[2].close();
  sockets[3].close();
  sockets.forEach((socket) => { socket.events.length = 0; });
  await sockets[0].receive({ type: 'ADD_MESSAGE', payload: { receiverId: 2, text: 'Offline' } });
  assert.equal(messages.length, 2);
  for (const socket of sockets.slice(0, 2)) {
    assert.deepEqual(socket.events, [{ type: 'ADD_MESSAGE', payload: messages[1] }]);
  }
  assert.deepEqual(sockets[4].events, []);
  const reconnected = new FakeSocket();
  connect(reconnected, {}, { id: 2, name: 'Boris' });
  reconnected.events.length = 0;
  await reconnected.receive({ type: 'INITIALIZE', payload: { receiverId: 1 } });
  assert.deepEqual(reconnected.events, [{ type: 'SET_MESSAGES', receiverId: 1, payload: messages }]);
});

test('WebSocket service failures retain safe CHAT_ERROR responses and original server diagnostics', async () => {
  const failure = new Error('private database diagnostic');
  const logs = [];
  const reject = async () => { throw failure; };
  const connect = load('../src/ws/connection.js', {
    '../service/chatService': { getMessages: reject, sendMessage: reject },
  }, logs);
  const socket = new FakeSocket();
  connect(socket, {}, { id: 1, name: 'Anna' });
  socket.events.length = 0;
  for (const type of ['INITIALIZE', 'ADD_MESSAGE']) {
    await socket.receive({ type, payload: { receiverId: 2, text: 'Hello' } });
    assert.deepEqual(socket.events.at(-1), {
      type: 'CHAT_ERROR', receiverId: 2, payload: 'Не удалось выполнить запрос чата.',
    });
    assert.equal(logs.at(-1)[0], 'Cannot process chat request:');
    assert.equal(logs.at(-1)[1], failure);
  }
  assert.equal(logs.length, 2);
  assert.ok(!JSON.stringify(socket.events).includes(failure.message));
});
