const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const AppError = require('../build/src/utils/appError');

function load(file, dependencies, logs = []) {
  const filename = path.resolve(__dirname, file);
  const sandbox = {
    module: { exports: {} },
    require(name) {
      if (name === '../utils/errorDetails') {
        return require('../build/src/utils/errorDetails');
      }
      if (name === '../utils/appError') {
        return require('../build/src/utils/appError');
      }
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
    console: { error: (...args) => logs.push(args) },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}

function setup(publishAdvertService, advertService = {}) {
  const logs = [];
  const exported = load('../build/src/controllers/advertController.js', {
    '../service/advertService': {},
    '../service/publishAdvertService': {},
    'fs/promises': {},
  }, logs);
  return { controller: new exported.constructor(advertService, publishAdvertService), logs };
}

function response() {
  return {
    locals: { user: { id: 7 } },
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('own adverts read failures return a stable code and safe message while logging the original error', async () => {
  const failure = Object.assign(new Error('private database diagnostic'), { code: 'EACCES' });
  const { controller, logs } = setup({}, { getMine: async () => { throw failure; } });
  const res = response();
  await controller.getMine({}, res);
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.stringify(res.body), JSON.stringify({
    code: 'OWN_ADVERTS_LOAD_FAILED', message: 'Cannot load own adverts',
  }));
  assert.deepEqual(logs, [['Cannot load own adverts:', failure]]);
});

test('own adverts success uses the authenticated user and forwards pagination parameters', async () => {
  const adverts = { items: [], total: 0, page: 2, limit: 12 };
  const query = { page: '2', limit: '12' };
  const { controller, logs } = setup({}, {
    getMine: async (id, params) => {
      assert.equal(id, 7);
      assert.equal(params, query);
      return adverts;
    },
  });
  const res = response();
  await controller.getMine({ query }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, adverts);
  assert.deepEqual(logs, []);
});

test('invalid pagination returns 400 without logging a server failure', async () => {
  const failure = new AppError(400, 'INVALID_PAGINATION', 'Invalid pagination parameters');
  const { controller, logs } = setup({}, { getMine: async () => { throw failure; } });
  const res = response();
  await controller.getMine({ query: { page: '0' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'INVALID_PAGINATION');
  assert.equal(res.body.message, 'Invalid pagination parameters');
  assert.deepEqual(logs, []);
});

test('publication validation errors return 400 with INVALID_ADVERT_DATA and a safe message', async () => {
  const service = load('../build/src/service/publishAdvertService.js', {
    'fs/promises': {},
    sharp: {},
    sequelize: {},
    '../../db/models': {},
    './advertService': {},
  });
  const { controller, logs } = setup(service);
  const res = response();
  await controller.createAdvert({ body: {}, files: [] }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.stringify(res.body), JSON.stringify({
    code: 'INVALID_ADVERT_DATA', message: 'Invalid title',
  }));
  assert.deepEqual(logs, []);
});

test('publication rejects absent files and Multer file dictionaries after validating the body', async () => {
  const service = load('../build/src/service/publishAdvertService.js', {
    'fs/promises': {},
    sharp: {},
    sequelize: {},
    '../../db/models': {},
    './advertService': {},
  });
  const body = {
    title: 'Room', body: 'Description', city: 'City', address: 'Street',
    square: '18', rooms: '2', floor: '3', price: '25000', tagIds: '[]',
  };
  for (const files of [undefined, { photos: [{ mimetype: 'image/png' }] }]) {
    const { controller, logs } = setup(service);
    const res = response();
    await controller.createAdvert({ body, files }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, 'INVALID_ADVERT_DATA');
    assert.equal(res.body.message, 'Add 1–10 photos');
    assert.deepEqual(logs, []);
  }
});

test('publication server errors retain their status, hide internal details and log the original error', async () => {
  for (const status of [undefined, 500, 503]) {
    const failure = status === undefined
      ? new Error('private SQL or file diagnostic')
      : new AppError(status, 'EACCES', 'private SQL or file diagnostic');
    const { controller, logs } = setup({ publishAdvert: async () => { throw failure; } });
    const res = response();
    await controller.createAdvert({ body: {}, files: [] }, res);
    assert.equal(res.statusCode, status || 500);
    assert.equal(JSON.stringify(res.body), JSON.stringify({
      code: 'ADVERT_PUBLISH_FAILED', message: 'Cannot publish advert',
    }));
    assert.deepEqual(logs, [['Cannot publish advert:', failure]]);
  }
});

test('unrecognized errors cannot expose their details as expected publication errors', async () => {
  const failure = new AppError(400, 'UNKNOWN', 'private internal diagnostic');
  const { controller, logs } = setup({ publishAdvert: async () => { throw failure; } });
  const res = response();
  await controller.createAdvert({ body: {}, files: [] }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'ADVERT_PUBLISH_FAILED');
  assert.equal(res.body.message, 'Cannot publish advert');
  assert.equal(logs[0][1], failure);
});

test('publication success passes the authenticated author to the injected service and returns 201', async () => {
  const advert = { id: 42, userId: 7 };
  const calls = [];
  const { controller, logs } = setup({ publishAdvert: async (...args) => { calls.push(args); return advert; } });
  const body = { title: 'Room', userId: 999 };
  const files = [{ buffer: Buffer.from('photo') }];
  const res = response();
  const { createAdvert } = controller;
  await createAdvert({ body, files }, res);
  assert.deepEqual(calls, [[body, files, 7]]);
  assert.equal(calls[0][1], files);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body, advert);
  assert.deepEqual(logs, []);
});
