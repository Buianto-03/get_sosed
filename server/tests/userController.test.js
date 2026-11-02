const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

function setup(profileService, userService = {}) {
  const logs = [];
  const exported = load('../src/controllers/userController.js', {
    '../service/userService': {},
    '../service/profileService': {},
  }, logs);
  return { controller: new exported.constructor(userService, profileService), logs };
}

function createProfileService(sequelize, user, userProfile) {
  const exported = load('../src/service/profileService.js', {
    crypto: {},
    'fs/promises': {},
    sharp: {},
    '../../db/models': {},
  });
  return new exported.constructor(sequelize, user, userProfile);
}

function response() {
  return {
    locals: { user: { id: 7 } },
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('user read failures return stable codes and safe messages while logging original errors', async () => {
  const failure = Object.assign(new Error('private database diagnostic'), { code: 'EACCES' });
  const reject = async () => { throw failure; };
  const { controller, logs } = setup({}, {
    getUsers: reject, getReceiverUsers: reject, getSummary: reject,
  });
  for (const [method, code, message, label] of [
    ['getUsers', 'USERS_LOAD_FAILED', 'Cannot load users', 'Cannot load users:'],
    ['getReceiverUsers', 'CONVERSATIONS_LOAD_FAILED', 'Cannot load conversations', 'Cannot load conversations:'],
    ['getSummary', 'USER_LOAD_FAILED', 'Cannot load user', 'Cannot load user:'],
  ]) {
    const res = response();
    await controller[method]({ params: { userId: '7' } }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(JSON.stringify(res.body), JSON.stringify({ code, message }));
    assert.deepEqual(logs.at(-1), [label, failure]);
  }
  assert.equal(logs.length, 3);
});

test('conversation ownership and invalid IDs return FORBIDDEN without accessing the service', async () => {
  const { controller, logs } = setup({}, {
    getReceiverUsers: async () => { assert.fail('Unexpected conversation query'); },
  });
  for (const userId of ['8', '0', '-1', 'abc', '1.5', '9007199254740992']) {
    const res = response();
    await controller.getReceiverUsers({ params: { userId } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(JSON.stringify(res.body), JSON.stringify({ code: 'FORBIDDEN', message: 'Forbidden' }));
  }
  assert.deepEqual(logs, []);
});

test('invalid and missing user summaries return USER_NOT_FOUND with 404', async () => {
  const ids = [];
  const { controller, logs } = setup({}, {
    getSummary: async (id) => { ids.push(id); return null; },
  });
  for (const userId of ['0', '-1', 'abc', '1.5', '9007199254740992', '8']) {
    const res = response();
    await controller.getSummary({ params: { userId } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(JSON.stringify(res.body), JSON.stringify({ code: 'USER_NOT_FOUND', message: 'User not found' }));
  }
  assert.deepEqual(ids, [8]);
  assert.deepEqual(logs, []);
});

test('user read successes preserve empty lists and the requested user summary', async () => {
  const users = [];
  const conversations = [];
  const summary = { id: 8, name: 'Anna' };
  const { controller, logs } = setup({}, {
    getUsers: async () => users,
    getReceiverUsers: async (id) => { assert.equal(id, 7); return conversations; },
    getSummary: async (id) => { assert.equal(id, 8); return summary; },
  });
  for (const [method, userId, expected] of [
    ['getUsers', '7', users],
    ['getReceiverUsers', '7', conversations],
    ['getSummary', '8', summary],
  ]) {
    const res = response();
    await controller[method]({ params: { userId } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, expected);
  }
  assert.deepEqual(logs, []);
});

test('profile validation errors return 400 with a stable code and safe message', async () => {
  const { controller, logs } = setup(createProfileService());
  const res = response();
  await controller.patchUser({ params: { userId: '7' }, body: { age: '17' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.stringify(res.body), JSON.stringify({
    code: 'INVALID_PROFILE_DATA', message: 'Invalid profile data',
  }));
  assert.deepEqual(logs, []);
});

test('profile ownership and invalid ID checks return 403 JSON without calling the service', async () => {
  const { controller, logs } = setup({ editProfile: async () => { assert.fail('Unexpected profile update'); } });
  for (const userId of ['8', '0', '-1', 'abc', '1.5', '9007199254740992']) {
    const res = response();
    await controller.patchUser({ params: { userId }, body: {} }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(JSON.stringify(res.body), JSON.stringify({ code: 'FORBIDDEN', message: 'Forbidden' }));
  }
  assert.deepEqual(logs, []);
});

test('missing profile owner returns 404 with USER_NOT_FOUND', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const profileService = createProfileService(
    { transaction: async (callback) => callback(transaction) },
    { findByPk: async () => null },
    {},
  );
  const { controller, logs } = setup(profileService);
  const res = response();
  await controller.patchUser({ params: { userId: '7' }, body: {} }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(JSON.stringify(res.body), JSON.stringify({ code: 'USER_NOT_FOUND', message: 'User not found' }));
  assert.deepEqual(logs, []);
});

test('profile server errors retain their status, hide private details and log the original error', async () => {
  for (const status of [undefined, 500, 503]) {
    const failure = Object.assign(new Error('private SQL or file diagnostic'), { code: 'EACCES' });
    if (status !== undefined) failure.status = status;
    const { controller, logs } = setup({ editProfile: async () => { throw failure; } });
    const res = response();
    await controller.patchUser({ params: { userId: '7' }, body: {} }, res);
    assert.equal(res.statusCode, status || 500);
    assert.equal(JSON.stringify(res.body), JSON.stringify({
      code: 'PROFILE_UPDATE_FAILED', message: 'Cannot update profile',
    }));
    assert.deepEqual(logs, [['Cannot update profile:', failure]]);
  }
});

test('unrecognized error codes cannot expose their messages as expected profile errors', async () => {
  const failure = Object.assign(new Error('private internal diagnostic'), { status: 400, code: 'UNKNOWN' });
  const { controller, logs } = setup({ editProfile: async () => { throw failure; } });
  const res = response();
  await controller.patchUser({ params: { userId: '7' }, body: {} }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'PROFILE_UPDATE_FAILED');
  assert.equal(res.body.message, 'Cannot update profile');
  assert.equal(logs[0][1], failure);
});

test('profile success still passes authenticated user, body and file to the service and returns its result', async () => {
  const user = { id: 7, name: 'Anna' };
  const calls = [];
  const { controller, logs } = setup({ editProfile: async (...args) => { calls.push(args); return user; } });
  const body = { city: 'City' };
  const file = { buffer: Buffer.from('photo') };
  const res = response();
  await controller.patchUser({ params: { userId: '7' }, body, file }, res);
  assert.deepEqual(calls, [[7, body, file]]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, user);
  assert.deepEqual(logs, []);
});
