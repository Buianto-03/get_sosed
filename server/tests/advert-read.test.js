const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const Sequelize = require('sequelize');

function loadWithDependency(file, dependency, replacement) {
  const filename = path.resolve(__dirname, file);
  const localRequire = createRequire(filename);
  const sandbox = {
    module: { exports: {} },
    require: (name) => name === dependency ? replacement : localRequire(name),
    console,
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}

function createService() {
  const sequelize = new Sequelize('test', 'test', 'test', {
    dialect: 'postgres', logging: false,
  });
  const models = {};
  const modelDirectory = path.resolve(__dirname, '../db/models');
  for (const file of fs.readdirSync(modelDirectory)) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    const model = require(path.join(modelDirectory, file))(sequelize, Sequelize.DataTypes);
    models[model.name] = model;
  }
  for (const model of Object.values(models)) model.associate?.(models);
  const service = loadWithDependency('../src/service/advertService.js', '../../db/models', models);
  return { service, sequelize, models };
}

test('all listing reads generate SQL with safe author fields and tags, preserving empty results', async () => {
  const { service, sequelize } = createService();
  const queries = [];
  // Exercise Sequelize query generation without connecting to a database.
  sequelize.query = async (sql, options) => {
    queries.push(sql);
    return options.plain ? null : [];
  };
  assert.deepEqual(await service.getAdverts(), []);
  assert.equal(await service.getAdvertById(1), null);
  assert.deepEqual(await service.likedAdverts(2), []);
  assert.deepEqual(await service.getFilteredAdverts({}), []);
  assert.deepEqual(await service.getTopAdvertsByLikes(), []);
  assert.equal(queries.length, 5);
  for (const sql of queries) {
    assert.doesNotMatch(sql, /hashpass/);
    assert.match(sql, /user\.email/);
    assert.match(sql, /tags\.name/);
    assert.match(sql, /LEFT OUTER JOIN "Locations"/);
  }
  await service.getFilteredAdverts({ city: 'Москва' });
  assert.match(queries.at(-1), /INNER JOIN "Locations"/);
});

test('photos use one batch query ordered by ID for multiple adverts', async () => {
  const { service, sequelize, models } = createService();
  const queries = [];
  sequelize.query = async (sql, options) => {
    queries.push(sql);
    if (options.model === models.Advert) {
      return [1, 2].map((id) => models.Advert.build({ id, user: { id: 7, name: 'Автор', email: 'author@example.com' }, location: null }, {
        isNewRecord: false, include: options.include,
      }));
    }
    return [];
  };
  const adverts = await service.getAdverts();
  assert.equal(queries.length, 2);
  assert.match(queries[1], /"advertId" IN \(1, 2\)/);
  assert.match(queries[1], /ORDER BY "AdvertPhoto"\."id" ASC/);
  assert.deepEqual(adverts.map((advert) => advert.toJSON().AdvertPhotos), [[], []]);
  for (const advert of adverts) {
    const data = advert.toJSON();
    assert.equal(data.user.name, 'Автор');
    assert.equal(data.location, null);
    assert.equal(Object.hasOwn(data, 'User'), false);
    assert.equal(Object.hasOwn(data, 'Location'), false);
  }
});

test('details return 200, 404 for absent/invalid IDs, and 500 on rejected reads', async () => {
  const service = { getAdvertById: async (id) => id === 1 ? { id } : null };
  const controller = loadWithDependency(
    '../src/controllers/advertController.js', '../service/advertService', service,
  );
  const response = () => ({
    code: null, body: null,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  });
  for (const [id, status] of [['1', 200], ['2', 404], ['abc', 404], ['0', 404]]) {
    const res = response();
    await controller.getAdvertById({ params: { advertId: id } }, res);
    assert.equal(res.code, status);
  }
  service.getAdvertById = async () => { throw new Error('database unavailable'); };
  const res = response();
  await controller.getAdvertById({ params: { advertId: '1' } }, res);
  assert.equal(res.code, 500);
  service.getAdverts = async () => { throw new Error('database unavailable'); };
  await controller.getAdverts({}, res);
  assert.equal(res.code, 500);
});
