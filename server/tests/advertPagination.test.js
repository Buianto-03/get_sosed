const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Sequelize = require('sequelize');

function load(models) {
  const filename = path.resolve(__dirname, '../build/src/service/advertService.js');
  const sandbox = {
    module: { exports: {} },
    require: (name) => {
      if (name === '../../db/models') {
        return models;
      }
      if (name === '../utils/appError') {
        return require('../build/src/utils/appError');
      }
      return require(name);
    },
    console,
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}

test('own advert pagination scopes both SQL queries to the owner, counts distinct adverts and limits ordered rows', async () => {
  const sequelize = new Sequelize('test', 'test', 'test', { dialect: 'postgres', logging: false });
  try {
    const models = {};
    const directory = path.resolve(__dirname, '../build/db/models');
    for (const file of fs.readdirSync(directory)) {
      if (!file.endsWith('.js') || file === 'index.js') continue;
      const model = require(path.join(directory, file))(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    }
    for (const model of Object.values(models)) model.associate?.(models);
    const service = load(models);
    const queries = [];
    let empty = false;
    sequelize.query = async (sql, options) => {
      queries.push(sql);
      if (options.plain) return { count: 6 };
      if (options.model === models.Advert && !empty) {
        return [4, 3].map((id) => models.Advert.build({ id, userId: 7 }, {
          isNewRecord: false, include: options.include,
        }));
      }
      return [];
    };
    const result = await service.getMine(7, { page: '2', limit: '2' });
    assert.deepEqual(result.items.map((item) => item.id), [4, 3]);
    assert.equal(result.total, 6);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 2);
    const count = queries.find((sql) => /count\(/i.test(sql));
    const rows = queries.find((sql) => /LIMIT 2 OFFSET 2/.test(sql));
    assert.match(count, /count\(DISTINCT\("Advert"\."id"\)\)/i);
    for (const sql of [count, rows]) assert.match(sql, /"Advert"\."userId" = 7/);
    assert.match(rows, /"Advert"\."createdAt" DESC, "Advert"\."id" DESC/);
    assert.doesNotMatch(rows, /hashpass/);
    assert.equal(queries.filter((sql) => /FROM "AdvertPhotos"/.test(sql)).length, 1);
    empty = true;
    const beyond = await service.getMine(7, { page: 4, limit: 2 });
    assert.equal(beyond.items.length, 0);
    assert.equal(beyond.total, 6);
  } finally {
    await sequelize.close();
  }
});

test('pagination defaults to 12 rows, accepts the maximum 50 and preserves empty response metadata', async () => {
  const exported = load({});
  const calls = [];
  const service = new exported.constructor({ findAndCountAll: async (options) => {
    calls.push(options);
    return { rows: [], count: 0 };
  } });
  const defaults = await service.getMine(7);
  assert.equal(JSON.stringify(defaults), JSON.stringify({ items: [], total: 0, page: 1, limit: 12 }));
  assert.equal(calls[0].limit, 12);
  assert.equal(calls[0].offset, 0);
  await service.getMine(7, { page: '2', limit: '50' });
  assert.equal(calls[1].limit, 50);
  assert.equal(calls[1].offset, 50);
});

test('invalid pagination rejects before accessing the database', async () => {
  const service = load({});
  for (const params of [
    { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: 'abc' },
    { page: ['1'] }, { page: {} }, { page: '' }, { page: null },
    { page: '9007199254740992' }, { page: Number.MAX_SAFE_INTEGER, limit: 50 },
    { limit: '0' }, { limit: '51' }, { limit: '1.5' }, { limit: ['12'] },
  ]) {
    await assert.rejects(service.getMine(7, params),
      (error) => error.status === 400 && error.code === 'INVALID_PAGINATION');
  }
});

test('public filtered page applies tag and location matches before its stable row limit', async () => {
  const sequelize = new Sequelize('test', 'test', 'test', { dialect: 'postgres', logging: false });
  try {
    const models = {};
    const directory = path.resolve(__dirname, '../build/db/models');
    for (const file of fs.readdirSync(directory)) {
      if (!file.endsWith('.js') || file === 'index.js') continue;
      const model = require(path.join(directory, file))(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    }
    for (const model of Object.values(models)) model.associate?.(models);
    const service = load(models);
    const queries = [];
    sequelize.query = async (sql, options) => {
      queries.push(sql);
      if (options.plain) return { count: 0 };
      return [];
    };
    const result = await service.getFilteredAdvertsPage({
      tags: [{ id: 4 }, { id: 6 }, { id: 4 }],
      city: 'Belgrade',
    }, { page: '2', limit: '5' });
    assert.equal(JSON.stringify(result), JSON.stringify({ items: [], total: 0, page: 2, limit: 5 }));
    const count = queries.find((sql) => /count\(/i.test(sql));
    const rows = queries.find((sql) => /LIMIT 5 OFFSET 5/.test(sql));
    assert.match(count, /count\(DISTINCT\("Advert"\."id"\)\)/i);
    assert.match(rows, /"createdAt" DESC, "Advert"\."id" DESC/);
    assert.match(rows, /"AdvertTags"/);
    assert.match(rows, /HAVING COUNT\(DISTINCT "tagId"\) = 2/);
    assert.match(rows, /FROM "Locations" AS "location"/);
    assert.match(rows, /"location"\."city" = 'Belgrade'/);
    const locationFilterIndex = rows.indexOf('LIMIT 1 ) IS NOT NULL');
    const rowLimitIndex = rows.indexOf('LIMIT 5 OFFSET 5');
    assert.ok(locationFilterIndex >= 0 && locationFilterIndex < rowLimitIndex);
  } finally {
    await sequelize.close();
  }
});

test('fresh adverts enforce the three row cap and use one bounded query without a count', async () => {
  const calls = [];
  const exported = load({});
  const service = new exported.constructor({
    findAll: async (options) => { calls.push(options); return []; },
  });
  assert.deepEqual(await service.getFreshAdverts(), []);
  assert.equal(calls[0].limit, 3);
  assert.equal(JSON.stringify(calls[0].order), JSON.stringify([['createdAt', 'DESC'], ['id', 'DESC']]));
  await assert.rejects(service.getFreshAdverts({ limit: 4 }),
    (error) => error.status === 400 && error.code === 'INVALID_PAGINATION');
  await assert.rejects(service.getFreshAdverts({ limit: ['3'] }),
    (error) => error.status === 400 && error.code === 'INVALID_PAGINATION');
});
