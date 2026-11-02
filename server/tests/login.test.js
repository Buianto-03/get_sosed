const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ found = true, matches = true, failure } = {}) {
  const calls = [];
  const userProfile = {};
  const user = { findOne: async (query) => {
    calls.push(['findOne', query]);
    if (failure) throw failure;
    if (!found) return null;
    const values = {
      id: 7, name: 'Anna', email: 'anna@example.invalid', roleId: 1,
      hashpass: 'secret-hash', internalFlag: true,
    };
    return {
      hashpass: values.hashpass,
      get: () => ({
        ...Object.fromEntries(query.attributes.map((key) => [key, values[key]])),
        UserProfile: Object.fromEntries(query.include[0].attributes.map((key) => [key, null])),
      }),
    };
  } };
  const dependencies = {
    '../../db/models': {},
    bcrypt: { compare: async (...args) => { calls.push(['compare', ...args]); return matches; } },
  };
  const sandbox = { module: { exports: {} }, require: (name) => {
    assert.ok(name in dependencies, name);
    return dependencies[name];
  } };
  const filename = path.resolve(__dirname, '../build/src/service/loginService.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return { service: new sandbox.module.exports.constructor(user, userProfile), calls, userProfile };
}
const body = { email: 'anna@example.invalid', password: 'password1' };

test('login checks password using injected models and returns only public fields', async () => {
  const { service, calls, userProfile } = setup();
  const user = await service.login(body);
  assert.equal(user.id, 7);
  assert.equal(user.hashpass, undefined);
  assert.equal(user.internalFlag, undefined);
  assert.equal(user.UserProfile.userId, undefined);
  assert.equal(calls[0][1].where.email, body.email);
  assert.equal(calls[0][1].include[0].model, userProfile);
  assert.deepEqual(calls[1], ['compare', body.password, 'secret-hash']);
});

test('missing user and incorrect password produce the same credential error', async () => {
  for (const options of [{ found: false }, { matches: false }]) {
    const { service } = setup(options);
    await assert.rejects(service.login(body), {
      status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password',
    });
  }
});

test('invalid credential types are rejected before querying the database', async () => {
  for (const input of [undefined, {}, { email: {}, password: 'x' }, { email: 'a', password: [] }, { ...body, password: '' }]) {
    const { service, calls } = setup();
    await assert.rejects(service.login(input), { status: 401, code: 'INVALID_CREDENTIALS' });
    assert.equal(calls.length, 0);
  }
});

test('unexpected database errors preserve the original error for controller logging', async () => {
  const failure = new Error('database unavailable');
  const { service } = setup({ failure });
  await assert.rejects(service.login(body), (error) => error === failure);
});
