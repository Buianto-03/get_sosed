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

function setup(signupService, generateTokens = () => ({}), loginService = {}) {
  const logs = [];
  const cookiesConfig = { httpOnly: true, maxAge: 1000 };
  const exported = load('../build/src/controllers/authController.js', {
    '../service/signupService': {},
    '../service/loginService': {},
    '../utils/generateTokens': generateTokens,
    '../configs/cookiesConfig': cookiesConfig,
  }, logs);
  const controller = new exported.constructor(signupService, loginService);
  return { controller, logs, cookiesConfig };
}

function response() {
  return {
    statusCode: 200,
    cookies: [],
    status(code) { this.statusCode = code; return this; },
    cookie(...args) { this.cookies.push(args); return this; },
    clearCookie(name) { this.clearedCookie = name; return this; },
    sendStatus(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('signup handler uses injected service and preserves tokens, cookie options and success response', async () => {
  const user = { id: 7, name: 'Anna' };
  const calls = [];
  const { controller, logs, cookiesConfig } = setup({
    signup: async (...args) => { calls.push(args); return user; },
  }, (payload) => {
    assert.equal(payload.user, user);
    return { accessToken: 'test-access', refreshToken: 'test-refresh' };
  });
  const body = { name: 'Anna', email: 'anna@example.invalid' };
  const file = { buffer: Buffer.from('photo') };
  const res = response();
  // Express invokes this callback without the controller as its receiver.
  const { signup } = controller;
  await signup({ body, file }, res);
  assert.deepEqual(calls, [[body, file]]);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.cookies, [['refreshToken', 'test-refresh', cookiesConfig]]);
  assert.equal(res.body.accessToken, 'test-access');
  assert.equal(res.body.user, user);
  assert.equal(res.body.refreshToken, undefined);
  assert.deepEqual(logs, []);
});

test('signup expected errors return status, stable code and message without logging or setting a cookie', async () => {
  for (const [status, code, message] of [
    [400, 'INVALID_SIGNUP_DATA', 'Invalid signup data'],
    [400, 'INVALID_PHOTO', 'Invalid photo'],
    [409, 'EMAIL_ALREADY_EXISTS', 'Email already exists'],
  ]) {
    const failure = Object.assign(new Error(message), { status, code });
    const { controller, logs } = setup({ signup: async () => { throw failure; } });
    const res = response();
    await controller.signup({ body: {} }, res);
    assert.equal(res.statusCode, status);
    assert.equal(res.body.code, code);
    assert.equal(res.body.message, message);
    assert.deepEqual(res.cookies, []);
    assert.deepEqual(logs, []);
  }
});

test('signup unexpected and 5xx errors keep safe responses and log original errors', async () => {
  for (const status of [undefined, 500, 503]) {
    const failure = Object.assign(new Error('private database diagnostic'), { code: 'EACCES' });
    if (status !== undefined) failure.status = status;
    const { controller, logs } = setup({ signup: async () => { throw failure; } });
    const res = response();
    await controller.signup({ body: {} }, res);
    assert.equal(res.statusCode, status || 500);
    assert.equal(res.body.code, 'SIGNUP_FAILED');
    assert.equal(res.body.message, 'Cannot sign up user');
    assert.ok(!JSON.stringify(res.body).includes(failure.message));
    assert.deepEqual(res.cookies, []);
    assert.deepEqual(logs, [['Cannot sign up user:', failure]]);
  }
});

test('unrecognized signup errors cannot expose internal codes or messages as expected errors', async () => {
  const failure = Object.assign(new Error('private internal diagnostic'), { status: 400, code: 'UNKNOWN' });
  const { controller, logs } = setup({ signup: async () => { throw failure; } });
  const res = response();
  await controller.signup({ body: {} }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'SIGNUP_FAILED');
  assert.equal(res.body.message, 'Cannot sign up user');
  assert.deepEqual(res.cookies, []);
  assert.equal(logs[0][1], failure);
});

test('token generation failures are handled before setting a refresh cookie', async () => {
  const failure = new Error('token signing failed');
  const { controller, logs } = setup({ signup: async () => ({ id: 7 }) }, () => { throw failure; });
  const res = response();
  await controller.signup({ body: {} }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'SIGNUP_FAILED');
  assert.equal(res.body.message, 'Cannot sign up user');
  assert.deepEqual(res.cookies, []);
  assert.equal(logs[0][1], failure);
});

test('signup route parses the photo upload before invoking the controller handler', () => {
  const routes = [];
  const upload = () => {};
  const signup = () => {};
  const login = () => {};
  const logout = () => {};
  const router = { post: (...args) => routes.push(args), get: (...args) => routes.push(args) };
  const exported = load('../build/src/router/authRouter.js', {
    express: { Router: () => router },
    bcrypt: {},
    '../../db/models': {},
    '../utils/generateTokens': {},
    '../configs/cookiesConfig': {},
    '../middlewares/handleUpload': (field) => { assert.equal(field, 'file'); return upload; },
    '../controllers/authController': { signup, login, logout },
  });
  assert.equal(exported, router);
  assert.deepEqual(routes.find(([route]) => route === '/login'), ['/login', login]);
  assert.deepEqual(routes.find(([route]) => route === '/logout'), ['/logout', logout]);
  assert.deepEqual(routes.find(([route]) => route === '/signup'), ['/signup', upload, signup]);
});

test('login uses injected service and returns tokens with the refresh cookie', async () => {
  const user = { id: 7, name: 'Anna' };
  const body = { email: 'anna@example.invalid', password: 'password1' };
  const { controller, cookiesConfig, logs } = setup({}, (payload) => {
    assert.equal(payload.user, user);
    return { accessToken: 'access', refreshToken: 'refresh' };
  }, { login: async (input) => { assert.equal(input, body); return user; } });
  const res = response();
  const { login } = controller;
  await login({ body }, res);
  assert.equal(res.body.user, user);
  assert.equal(res.body.accessToken, 'access');
  assert.equal(res.body.refreshToken, undefined);
  assert.deepEqual(res.cookies, [['refreshToken', 'refresh', cookiesConfig]]);
  assert.deepEqual(logs, []);
});

test('login distinguishes invalid credentials from internal failures without leaking diagnostics', async () => {
  for (const expected of [true, false]) {
    const failure = Object.assign(new Error('private diagnostic'), {
      status: 401, code: expected ? 'INVALID_CREDENTIALS' : 'INTERNAL_CODE',
    });
    const { controller, logs } = setup({}, undefined, { login: async () => { throw failure; } });
    const res = response();
    await controller.login({ body: {} }, res);
    assert.equal(res.statusCode, expected ? 401 : 500);
    assert.equal(res.body.code, expected ? 'INVALID_CREDENTIALS' : 'LOGIN_FAILED');
    assert.ok(!JSON.stringify(res.body).includes(failure.message));
    assert.deepEqual(res.cookies, []);
    assert.equal(logs.length, expected ? 0 : 1);
    if (!expected) assert.equal(logs[0][1], failure);
  }
});

test('login token generation failure does not set a cookie', async () => {
  const failure = new Error('signing failed');
  const { controller, logs } = setup({}, () => { throw failure; }, { login: async () => ({ id: 7 }) });
  const res = response();
  await controller.login({ body: {} }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'LOGIN_FAILED');
  assert.deepEqual(res.cookies, []);
  assert.equal(logs[0][1], failure);
});

test('logout clears the refresh cookie and returns 200 without a service', () => {
  const { controller } = setup({});
  const res = response();
  const { logout } = controller;
  logout({}, res);
  assert.equal(res.clearedCookie, 'refreshToken');
  assert.equal(res.statusCode, 200);
});
