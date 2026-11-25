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

function setup(publishListingService, listingService = {}) {
  const logs = [];
  const exported = load('../build/src/controllers/listingController.js', {
    '../service/listingService': {},
    '../service/publishListingService': {},
    'fs/promises': {},
  }, logs);
  return { controller: new exported.constructor(listingService, publishListingService), logs };
}

function response() {
  return {
    locals: { user: { id: 7 } },
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('own listings read failures return a stable code and safe message while logging the original error', async () => {
  const failure = Object.assign(new Error('private database diagnostic'), { code: 'EACCES' });
  const { controller, logs } = setup({}, { getMine: async () => { throw failure; } });
  const res = response();
  await controller.getMine({}, res);
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.stringify(res.body), JSON.stringify({
    code: 'OWN_LISTINGS_LOAD_FAILED', message: 'Cannot load own listings',
  }));
  assert.deepEqual(logs, [['Cannot load own listings:', failure]]);
});

test('own listings success uses the authenticated user and forwards pagination parameters', async () => {
  const listings = { items: [], total: 0, page: 2, limit: 12 };
  const query = { page: '2', limit: '12' };
  const { controller, logs } = setup({}, {
    getMine: async (id, params) => {
      assert.equal(id, 7);
      assert.equal(params, query);
      return listings;
    },
  });
  const res = response();
  await controller.getMine({ query }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, listings);
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

test('public filtered page forwards body and query and returns the page object', async () => {
  const filters = { city: 'Belgrade' };
  const query = { page: '2', limit: '4' };
  const page = { items: [], total: 0, page: 2, limit: 4 };
  const { controller } = setup({}, {
    getFilteredListingsPage: async (receivedFilters, pagination) => {
      assert.equal(receivedFilters, filters);
      assert.equal(pagination, query);
      return page;
    },
  });
  const res = response();
  await controller.getFilteredListingsPage({ body: filters, query }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, page);
});

test('fresh listing errors use a stable safe code and invalid limits return 400', async () => {
  const { controller, logs } = setup({}, {
    getFreshListings: async () => { throw new AppError(400, 'INVALID_PAGINATION', 'Invalid pagination parameters'); },
  });
  const invalid = response();
  await controller.getFreshListings({ query: { limit: '4' } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.body.code, 'INVALID_PAGINATION');
  const failed = setup({}, {
    getFreshListings: async () => { throw new Error('private SQL details'); },
  });
  const res = response();
  await failed.controller.getFreshListings({ query: {} }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.stringify(res.body), JSON.stringify({
    code: 'FRESH_LISTINGS_LOAD_FAILED', message: 'Cannot load fresh listings',
  }));
  assert.equal(logs.length, 0);
  assert.equal(failed.logs.length, 1);
});

test('publication validation errors return 400 with INVALID_LISTING_DATA and a safe message', async () => {
  const service = load('../build/src/service/publishListingService.js', {
    'fs/promises': {},
    sharp: {},
    sequelize: {},
    '../../db/models': {},
    './listingService': {},
  });
  const { controller, logs } = setup(service);
  const res = response();
  await controller.createListing({ body: {}, files: [] }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.stringify(res.body), JSON.stringify({
    code: 'INVALID_LISTING_DATA', message: 'Invalid title',
  }));
  assert.deepEqual(logs, []);
});

test('publication rejects absent files and Multer file dictionaries after validating the body', async () => {
  const service = load('../build/src/service/publishListingService.js', {
    'fs/promises': {},
    sharp: {},
    sequelize: {},
    '../../db/models': {},
    './listingService': {},
  });
  const body = {
    title: 'Room', body: 'Description', city: 'City', address: 'Street',
    square: '18', rooms: '2', floor: '3', price: '25000', tagIds: '[]',
  };
  for (const files of [undefined, { photos: [{ mimetype: 'image/png' }] }]) {
    const { controller, logs } = setup(service);
    const res = response();
    await controller.createListing({ body, files }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, 'INVALID_LISTING_DATA');
    assert.equal(res.body.message, 'Add 1–10 photos');
    assert.deepEqual(logs, []);
  }
});

test('publication server errors retain their status, hide internal details and log the original error', async () => {
  for (const status of [undefined, 500, 503]) {
    const failure = status === undefined
      ? new Error('private SQL or file diagnostic')
      : new AppError(status, 'EACCES', 'private SQL or file diagnostic');
    const { controller, logs } = setup({ publishListing: async () => { throw failure; } });
    const res = response();
    await controller.createListing({ body: {}, files: [] }, res);
    assert.equal(res.statusCode, status || 500);
    assert.equal(JSON.stringify(res.body), JSON.stringify({
      code: 'LISTING_PUBLISH_FAILED', message: 'Cannot publish listing',
    }));
    assert.deepEqual(logs, [['Cannot publish listing:', failure]]);
  }
});

test('unrecognized errors cannot expose their details as expected publication errors', async () => {
  const failure = new AppError(400, 'UNKNOWN', 'private internal diagnostic');
  const { controller, logs } = setup({ publishListing: async () => { throw failure; } });
  const res = response();
  await controller.createListing({ body: {}, files: [] }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'LISTING_PUBLISH_FAILED');
  assert.equal(res.body.message, 'Cannot publish listing');
  assert.equal(logs[0][1], failure);
});

test('publication success passes the authenticated author to the injected service and returns 201', async () => {
  const listing = { id: 42, userId: 7 };
  const calls = [];
  const { controller, logs } = setup({ publishListing: async (...args) => { calls.push(args); return listing; } });
  const body = { title: 'Room', userId: 999 };
  const files = [{ buffer: Buffer.from('photo') }];
  const res = response();
  const { createListing } = controller;
  await createListing({ body, files }, res);
  assert.deepEqual(calls, [[body, files, 7]]);
  assert.equal(calls[0][1], files);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body, listing);
  assert.deepEqual(logs, []);
});
