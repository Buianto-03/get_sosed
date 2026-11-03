const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('token refresh excludes the password without mutating user data or dropping the profile', async () => {
  const storedUser = {
    id: 7,
    name: 'Anna',
    email: 'anna@example.com',
    roleId: 2,
    hashpass: 'private-hash',
    UserProfile: { photo: '/images/photo.webp', habits: ['No smoking'] },
  };
  const { hashpass, ...expectedUser } = storedUser;
  let handler;
  const dependencies = {
    express: { Router: () => ({ get(route, middleware, callback) {
      assert.equal(route, '/refresh');
      handler = callback;
    } }) },
    '../../db/models': { User: { findOne: async (options) => {
      assert.equal(options.where.id, 7);
      return { get: () => storedUser };
    } } },
    '../middlewares/verifyRefreshToken': () => {},
    '../utils/generateTokens': ({ user }) => {
      assert.equal(JSON.stringify(user), JSON.stringify(expectedUser));
      return { accessToken: 'access', refreshToken: 'refresh' };
    },
    '../configs/cookiesConfig': { httpOnly: true, maxAge: 1000 },
  };
  const filename = path.resolve(__dirname, '../build/src/router/tokensRouter.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module: { exports: {} },
    require(name) {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
  }, { filename });
  const res = {
    locals: { user: { id: 7 } },
    cookie(...args) { this.cookieArgs = args; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler({}, res);
  assert.equal(res.body.accessToken, 'access');
  assert.equal(JSON.stringify(res.body.user), JSON.stringify(expectedUser));
  assert.equal(storedUser.hashpass, 'private-hash');
  assert.equal(res.body.user.UserProfile, storedUser.UserProfile);
  assert.deepEqual(res.cookieArgs, ['refreshToken', 'refresh', dependencies['../configs/cookiesConfig']]);
});
