const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(file, dependency, replacement) {
  const filename = path.resolve(__dirname, file);
  const sandbox = { module: { exports: {} }, require: (name) => {
    assert.equal(name, dependency);
    return replacement;
  } };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}
function response() {
  return { locals: { user: { id: 2 } }, status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; } };
}

test('like reads use injected models and preserve the response without mutating or exposing password hashes', async () => {
  const exported = load('../src/service/likeService.js', '../../db/models', {
    Like: {}, User: {}, UserProfile: {},
  });
  const user = {};
  const userProfile = {};
  const row = {
    id: 9,
    userId: 2,
    advertId: 7,
    User: {
      id: 2,
      name: 'Анна',
      email: 'anna@example.com',
      roleId: 2,
      hashpass: 'private-hash',
      UserProfile: { photo: '/images/users/user-2/photo.webp' },
    },
  };
  let rows = [row];
  const like = {
    findAll: async (query) => {
      assert.equal(query.where.advertId, '7');
      assert.equal(query.include.model, user);
      assert.equal(query.include.include.model, userProfile);
      return rows;
    },
  };
  const service = new exported.constructor(like, user, userProfile);
  const result = await service.getLikesByAdvertId('7');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [{
    id: 9,
    userId: 2,
    advertId: 7,
    User: {
      id: 2,
      name: 'Анна',
      email: 'anna@example.com',
      roleId: 2,
      UserProfile: { photo: '/images/users/user-2/photo.webp' },
    },
  }]);
  assert.equal(row.User.hashpass, 'private-hash');
  rows = [];
  assert.equal((await service.getLikesByAdvertId('7')).length, 0);
});

test('POST returns the same like with 201 then 200, without exposing credentials', async () => {
  const row = { id: 9, userId: 2, advertId: 7 };
  let exists = false;
  const Like = {
    async findOrCreate({ where }) {
      assert.equal(where.advertId, '7');
      assert.equal(where.userId, 2);
      const created = !exists;
      exists = true;
      return [{ get: () => row }, created];
    },
    async findByPk(id, options) {
      assert.equal(id, 9);
      assert.deepEqual(Array.from(options.include.attributes), ['id', 'name']);
      return row;
    },
  };
  const service = load('../src/service/likeService.js', '../../db/models', { Like, User: {}, UserProfile: {} });
  const controller = load('../src/controllers/likeController.js', '../service/likeService', service);
  for (const code of [201, 200]) {
    const res = response();
    await controller.setLike({ params: { advertId: '7' } }, res);
    assert.equal(res.code, code);
    assert.deepEqual(res.body, row);
  }
});

test('DELETE scopes to current user and consistently returns advertId/deleted', async () => {
  let exists = true;
  const Like = { async destroy({ where }) {
    assert.equal(where.advertId, '7');
    assert.equal(where.userId, 2);
    const count = exists ? 1 : 0;
    exists = false;
    return count;
  } };
  const service = load('../src/service/likeService.js', '../../db/models', { Like });
  const controller = load('../src/controllers/likeController.js', '../service/likeService', service);
  for (const deleted of [true, false]) {
    const res = response();
    await controller.deleteLike({ params: { advertId: '7' } }, res);
    assert.equal(res.code, 200);
    assert.equal(JSON.stringify(res.body), JSON.stringify({ advertId: 7, deleted }));
  }
});

test('failed mutations return 500, never a successful deletion', async () => {
  const controller = load('../src/controllers/likeController.js', '../service/likeService', {
    postLike: async () => { throw new Error('offline'); },
    deleteLike: async () => { throw new Error('offline'); },
  });
  for (const method of ['setLike', 'deleteLike']) {
    const res = response();
    await controller[method]({ params: { advertId: '7' } }, res);
    assert.equal(res.code, 500);
  }
});
