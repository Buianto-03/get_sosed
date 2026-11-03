const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const Sequelize = require('sequelize');

function loadWithDependency(file, dependency, replacement, logger = console) {
  const filename = path.resolve(__dirname, file);
  const localRequire = createRequire(filename);
  const sandbox = {
    module: { exports: {} },
    require: (name) => name === dependency ? replacement : localRequire(name),
    console: logger,
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}

function createService(logger = console) {
  const sequelize = new Sequelize('test', 'test', 'test', {
    dialect: 'postgres', logging: false,
  });
  const models = {};
  const modelDirectory = path.resolve(__dirname, '../build/db/models');
  for (const file of fs.readdirSync(modelDirectory)) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    const model = require(path.join(modelDirectory, file))(sequelize, Sequelize.DataTypes);
    models[model.name] = model;
  }
  for (const model of Object.values(models)) model.associate?.(models);
  const service = loadWithDependency('../build/src/service/advertService.js', '../../db/models', models, logger);
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
  await service.getFilteredAdverts({
    city: 'Москва', district: 'Центр', metro: 'Арбатская',
  });
  assert.match(queries.at(-1), /"location"\."city" = 'Москва'/);
  assert.match(queries.at(-1), /"location"\."district" = 'Центр'/);
  assert.match(queries.at(-1), /"location"\."metro" = 'Арбатская'/);
});

test('top adverts use the injected model and preserve the result, fields and ranking query', async () => {
  const { service, models } = createService();
  models.Advert.findAll = async () => {
    assert.fail('The imported advert model must not be queried');
  };
  const rows = [{ id: 42, title: 'Комната', likeCount: '3' }];
  let query;
  const advert = {
    findAll: async (options) => {
      query = options;
      return rows;
    },
  };
  const location = {};
  const tags = {};
  const user = {};
  const advertPhoto = {};
  const isolated = new service.constructor(advert, location, tags, user, {}, advertPhoto, {});
  assert.equal(await isolated.getTopAdvertsByLikes(), rows);
  assert.equal(query.limit, 4);
  assert.deepEqual(Array.from(query.attributes.slice(0, -1)), [
    'id', 'title', 'body', 'price', 'floor', 'square', 'rooms',
    'userId', 'createdAt', 'updatedAt',
  ]);
  const [count, alias] = query.attributes.at(-1);
  assert.equal(alias, 'likeCount');
  assert.match(count.val, /SELECT COUNT\(\*\)/);
  assert.match(count.val, /"Likes"\."advertId" = "Advert"\."id"/);
  assert.equal(query.order[0][0].val, '"likeCount"');
  assert.equal(query.order[0][1], 'DESC');
  assert.equal(query.include[0].model, user);
  assert.deepEqual(Array.from(query.include[0].attributes), ['id', 'name', 'email']);
  assert.equal(query.include[1].model, location);
  assert.equal(query.include[2].model, advertPhoto);
  assert.equal(query.include[3].model, tags);
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
    '../build/src/controllers/advertController.js', '../service/advertService', service,
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

test('tag catalog returns stable IDs and only id/name; searching preserves all catalog entries', async () => {
  const { service, sequelize, models } = createService();
  const queries = [];
  sequelize.query = async (sql) => {
    queries.push(sql);
    return [models.Tags.build({ id: 73, name: 'Для некурящих' }, { isNewRecord: false })];
  };
  const first = await service.getTagsLikeStr('');
  const second = await service.getTagsLikeStr('');
  assert.equal(first[0].id, second[0].id);
  assert.match(queries[0], /SELECT "id", "name" FROM "Tags"/);
  assert.match(queries[0], /ORDER BY "Tags"\."id" ASC/);
  assert.doesNotMatch(queries[0], /WHERE/);
  await service.getTagsLikeStr('курящ');
  assert.match(queries.at(-1), /ILIKE '%курящ%'/);
});

test('tag endpoint accepts absent query, rejects structured query and handles service failures', async () => {
  let receivedQuery;
  const controller = loadWithDependency(
    '../build/src/controllers/advertController.js', '../service/advertService', {
      getTagsLikeStr: async (query) => {
        receivedQuery = query;
        if (query === 'fail') throw new Error('offline');
        return [];
      },
    },
  );
  for (const [query, expectedStatus] of [
    [{}, 200], [{ query: '  курящ  ' }, 200],
    [{ query: ['a', 'b'] }, 400], [{ query: { name: 'a' } }, 400],
    [{ query: 'fail' }, 500],
  ]) {
    const res = {
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; return this; },
    };
    await controller.getTagsBySearch({ query }, res);
    assert.equal(res.code, expectedStatus);
    if (!query.query) assert.equal(receivedQuery, '');
    if (query.query === '  курящ  ') assert.equal(receivedQuery, 'курящ');
  }
});

test('condition migration is repeatable and rollback preserves existing user links and IDs', async () => {
  const migration = require('../db/migrations/20261018000000-add-listing-condition-tags');
  const tags = [
    { id: 73, name: 'Для некурящих' },
    { id: 109, name: 'Питомцы разрешены' },
    { id: 28, name: 'Рядом с метро' },
  ];
  const links = [{ advertId: 1, tagId: 73 }];
  const queryInterface = {
    sequelize: {
      transaction: async (callback) => callback({}),
      query: async (sql) => sql.startsWith('SELECT') ? tags : undefined,
    },
    bulkInsert: async (table, rows) => {
      assert.equal(table, 'Tags');
      rows.forEach((row) => tags.push({ ...row, id: tags.length + 200 }));
    },
  };
  await migration.up(queryInterface, Sequelize);
  const afterFirstRun = structuredClone(tags);
  assert.equal(tags.length, 5);
  assert.equal(tags.find(({ name }) => name === 'Для некурящих').id, 73);
  assert.equal(tags.find(({ name }) => name === 'Рядом с метро').id, 28);
  await migration.up(queryInterface, Sequelize);
  assert.deepEqual(tags, afterFirstRun);
  await migration.down(queryInterface, Sequelize);
  assert.deepEqual(tags, afterFirstRun);
  assert.deepEqual(links, [{ advertId: 1, tagId: 73 }]);
  await migration.up(queryInterface, Sequelize);
  assert.deepEqual(tags, afterFirstRun);
});

test('selected tags normalize IDs, use HAVING COUNT DISTINCT for an AND match and scope the final query', async () => {
  const { service, sequelize } = createService();
  const queries = [];
  sequelize.query = async (sql) => {
    queries.push(sql);
    return queries.length === 1 ? [{ advertId: 42 }, { advertId: 77 }] : [];
  };
  await service.getFilteredAdverts({ tags: [
    { id: '73' }, { id: 109 }, { id: 73 },
    { id: 0 }, { id: -1 }, { id: 1.5 }, { id: 'bad' },
  ] });
  assert.equal(queries.length, 2);
  assert.match(queries[0], /"tagId" IN \(73, 109\)/);
  assert.match(queries[0], /HAVING COUNT\(DISTINCT\("tagId"\)\) = 2/);
  assert.match(queries[1], /"Advert"\."id" IN \(42, 77\)/);
});

test('price and room ranges preserve single bounds, combined bounds and numeric versus string zero', async () => {
  const { service, sequelize } = createService();
  let sql;
  sequelize.query = async (query) => {
    sql = query;
    return [];
  };
  const cases = [
    {},
    { from: 10, expectedFrom: 10 },
    { to: 20, expectedTo: 20 },
    { from: 10, to: 20, expectedFrom: 10, expectedTo: 20 },
    { from: 0 },
    { to: 0 },
    { from: 0, to: 20, expectedFrom: 0, expectedTo: 20 },
    { from: '0', expectedFrom: 0 },
    { to: '0', expectedTo: 0 },
    { from: null, to: 20, expectedFrom: 0, expectedTo: 20 },
  ];
  for (const field of ['price', 'rooms']) {
    for (const { from, to, expectedFrom, expectedTo } of cases) {
      assert.deepEqual(await service.getFilteredAdverts({
        [`${field}From`]: from,
        [`${field}To`]: to,
      }), []);
      if (expectedFrom === undefined) {
        assert.doesNotMatch(sql, new RegExp(`"${field}" >=`));
      } else {
        assert.ok(sql.includes(`"${field}" >= ${expectedFrom}`));
      }
      if (expectedTo === undefined) {
        assert.doesNotMatch(sql, new RegExp(`"${field}" <=`));
      } else {
        assert.ok(sql.includes(`"${field}" <= ${expectedTo}`));
      }
    }
  }
});

test('a tag search without matches keeps an empty ID filter instead of returning every advert', async () => {
  const { service, sequelize } = createService();
  const queries = [];
  sequelize.query = async (sql) => {
    queries.push(sql);
    return [];
  };
  assert.deepEqual(await service.getFilteredAdverts({ tags: [{ id: 73 }] }), []);
  assert.equal(queries.length, 2);
  assert.match(queries[1], /"Advert"\."id" IN \(NULL\)/);
});

test('absent, empty and invalid-only tag selections skip the tag query and ID restriction', async () => {
  for (const tags of [undefined, [], [{ id: 0 }, { id: -1 }, { id: 'bad' }]]) {
    const { service, sequelize } = createService();
    const queries = [];
    sequelize.query = async (sql) => {
      queries.push(sql);
      return [];
    };
    assert.deepEqual(await service.getFilteredAdverts({ tags }), []);
    assert.equal(queries.length, 1);
    assert.doesNotMatch(queries[0], /HAVING|"Advert"\."id" IN/);
  }
});

test('filtering logs and preserves the original error from either database query', async () => {
  for (const failedQuery of [1, 2]) {
    const logs = [];
    const { service, sequelize } = createService({ error: (...args) => logs.push(args) });
    const failure = new Error('database unavailable');
    let queries = 0;
    sequelize.query = async () => {
      queries += 1;
      if (queries === failedQuery) {
        throw failure;
      }
      return [];
    };
    await assert.rejects(
      service.getFilteredAdverts({ tags: [{ id: 73 }] }),
      (error) => error === failure,
    );
    assert.equal(queries, failedQuery);
    assert.deepEqual(logs, [['Ошибка при фильтрации объявлений:', failure]]);
  }
});

test('filter preparation errors stay outside database access and database-error logging', async () => {
  const logs = [];
  const { service, sequelize } = createService({ error: (...args) => logs.push(args) });
  let queries = 0;
  sequelize.query = async () => {
    queries += 1;
    return [];
  };
  await assert.rejects(
    service.getFilteredAdverts({ tags: {} }),
    (error) => error.name === 'TypeError',
  );
  assert.equal(queries, 0);
  assert.deepEqual(logs, []);
});
