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

const exported = load('../build/src/service/chatService.js', {
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

test('history pages apply strict conversation and cursor predicates and return ascending IDs', async () => {
  const rows = Array.from({ length: 106 }, (_, index) => ({ id: 2 * index + 2 }));
  const cases = [
    { input: {}, ids: rows.slice(-50), nextCursor: 114, queryLimit: 51 },
    { input: { limit: 100 }, ids: rows.slice(-100), nextCursor: 14, queryLimit: 101 },
    { input: { beforeId: 10, limit: 2 }, ids: [{ id: 6 }, { id: 8 }], nextCursor: 6, queryLimit: 3 },
    { input: { beforeId: 6, limit: 2 }, ids: [{ id: 2 }, { id: 4 }], nextCursor: null, queryLimit: 3 },
    { input: { beforeId: 2 }, ids: [], nextCursor: null, queryLimit: 51 },
    { input: { afterId: 204, limit: 2 }, ids: [{ id: 206 }, { id: 208 }], nextCursor: 208, queryLimit: 3 },
    { input: { afterId: 210, limit: 2 }, ids: [{ id: 212 }], nextCursor: null, queryLimit: 3 },
    { input: { afterId: 212 }, ids: [], nextCursor: null, queryLimit: 51 },
    { input: { afterId: 0, limit: 1 }, ids: [{ id: 2 }], nextCursor: 2, queryLimit: 2 },
  ];

  for (const { input, ids, nextCursor, queryLimit } of cases) {
    const { beforeId, afterId } = input;
    const service = createService({
      findAll: async (options) => {
        assert.deepEqual(Reflect.ownKeys(options.where), [
          ...(beforeId === undefined && afterId === undefined ? [] : ['id']),
          Op.or,
        ]);
        assert.equal(JSON.stringify(options.where[Op.or]), JSON.stringify([
          { senderId: 1, receiverId: 2 },
          { senderId: 2, receiverId: 1 },
        ]));
        assert.equal(options.limit, queryLimit);
        assert.equal(options.order[0][0], 'id');
        assert.equal(options.order[0][1], afterId === undefined ? 'DESC' : 'ASC');
        assert.deepEqual(Array.from(options.attributes), [
          'id', 'senderId', 'receiverId', 'message', 'createdAt', 'updatedAt',
        ]);
        checkParticipants(options, service);

        if (beforeId !== undefined) {
          assert.deepEqual(Reflect.ownKeys(options.where.id), [Op.lt]);
          assert.equal(options.where.id[Op.lt], beforeId);
          return rows.filter(({ id }) => id < beforeId).reverse().slice(0, options.limit);
        }
        if (afterId !== undefined) {
          assert.deepEqual(Reflect.ownKeys(options.where.id), [Op.gt]);
          assert.equal(options.where.id[Op.gt], afterId);
          return rows.filter(({ id }) => id > afterId).slice(0, options.limit);
        }
        return [...rows].reverse().slice(0, options.limit);
      },
    });
    const result = await service.getHistoryPage(1, 2, input);
    assert.deepEqual(Array.from(result.messages), ids);
    assert.equal(result.hasMore, nextCursor !== null);
    assert.equal(result.nextCursor, nextCursor);
  }
});

test('history pages reject invalid options before lookup and invalid receivers before reading history', async () => {
  const lookups = [];
  const service = createService({}, {
    findByPk: async (id) => {
      lookups.push(id);
      return null;
    },
  });
  for (const field of ['beforeId', 'afterId', 'limit']) {
    for (const value of [null, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1, '2', [], true]) {
      await assert.rejects(service.getHistoryPage(1, 2, { [field]: value }), /Invalid history page/);
    }
  }
  for (const input of [{ beforeId: 0 }, { limit: 0 }, { limit: 101 }, { beforeId: 5, afterId: 0 }]) {
    await assert.rejects(service.getHistoryPage(1, 2, input), /Invalid history page/);
  }
  for (const receiverId of [null, 0, -1, 1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1, '2']) {
    await assert.rejects(service.getHistoryPage(1, receiverId, {}), /Invalid receiver/);
  }
  assert.deepEqual(lookups, []);
  await assert.rejects(service.getHistoryPage(1, 2, {}), /User not found/);
  assert.deepEqual(lookups, [2]);
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
  const connect = load('../build/src/ws/connection.js', {
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

test('WebSocket pages use the authenticated user and correlate each response to the requesting tab', async () => {
  const messages = [{ id: 5, senderId: 1, receiverId: 2, message: 'Hello' }];
  const calls = [];
  const connect = load('../build/src/ws/connection.js', {
    '../service/chatService': {
      getHistoryPage: async (userId, receiverId, options) => {
        calls.push([userId, receiverId, { ...options }]);
        return { messages, hasMore: true, nextCursor: 5 };
      },
    },
  });
  const sockets = [1, 1, 2, 3].map((id) => {
    const socket = new FakeSocket();
    connect(socket, {}, { id, name: `User ${id}` });
    return socket;
  });
  sockets.forEach((socket) => { socket.events.length = 0; });

  await sockets[0].receive({
    type: 'GET_HISTORY_PAGE',
    payload: { requestId: 'history-1', receiverId: 2, senderId: 999, afterId: 0, limit: 1 },
  });
  assert.deepEqual(calls, [[1, 2, { afterId: 0, beforeId: undefined, limit: 1 }]]);
  assert.deepEqual(sockets[0].events, [{
    type: 'HISTORY_PAGE', requestId: 'history-1', receiverId: 2, payload: messages, hasMore: true, nextCursor: 5,
  }]);
  for (const socket of sockets.slice(1)) {
    assert.deepEqual(socket.events, []);
  }
});

test('WebSocket pages correlate service errors and reject invalid identifiers without querying history', async () => {
  const failure = new Error('private database diagnostic');
  const logs = [];
  const calls = [];
  const connect = load('../build/src/ws/connection.js', {
    '../service/chatService': {
      getHistoryPage: async (...args) => {
        calls.push(args);
        throw failure;
      },
    },
  }, logs);
  const socket = new FakeSocket();
  connect(socket, {}, { id: 1, name: 'Anna' });
  socket.events.length = 0;
  for (const requestId of [undefined, '', '  ', 12]) {
    await socket.receive({ type: 'GET_HISTORY_PAGE', payload: { requestId, receiverId: 2 } });
    assert.deepEqual(socket.events.at(-1), {
      type: 'CHAT_ERROR', receiverId: 2, payload: 'Не удалось выполнить запрос чата.',
    });
  }
  for (const receiverId of ['2', 0, -2, 2.5, Number.MAX_SAFE_INTEGER + 1]) {
    await socket.receive({ type: 'GET_HISTORY_PAGE', payload: { requestId: 'history-1', receiverId } });
    assert.deepEqual(socket.events.at(-1), {
      type: 'CHAT_ERROR', receiverId: 0, payload: 'Не удалось выполнить запрос чата.',
    });
  }
  assert.equal(calls.length, 0);

  await socket.receive({ type: 'GET_HISTORY_PAGE', payload: { requestId: 'history-2', receiverId: 2 } });
  assert.deepEqual(socket.events.at(-1), {
    type: 'CHAT_ERROR', requestId: 'history-2', receiverId: 2, payload: 'Не удалось выполнить запрос чата.',
  });
  assert.equal(calls.length, 1);
  assert.equal(logs.at(-1)[1], failure);
});

test('WebSocket messages reach all participant tabs, support an offline receiver and preserve reconnect history', async () => {
  const messages = [];
  const connect = load('../build/src/ws/connection.js', {
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
  const connect = load('../build/src/ws/connection.js', {
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
