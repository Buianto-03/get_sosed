// Run against an empty, migrated scratch database named o06_adverts or o06_adverts_small on a private Unix socket.
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { writeFile } = require('node:fs/promises');
const { isAbsolute } = require('node:path');

const { DB_HOST, DB_NAME, DB_USER, NODE_ENV } = process.env;
assert.ok(
  NODE_ENV === 'development' &&
    ['o06_adverts', 'o06_adverts_small'].includes(DB_NAME) &&
    DB_USER &&
    DB_HOST &&
    isAbsolute(DB_HOST),
  'Use explicit development settings and a private PostgreSQL socket for an O06 scratch database.',
);

const db = require('../build/db/models');
const server = require('../build/src/app');

async function seed(size) {
  const createdAt = new Date('2026-01-01T00:00:00Z');
  const newer = new Date('2026-01-02T00:00:00Z');
  return db.sequelize.transaction(async (transaction) => {
    const role = await db.Role.create({ name: 'Fixture' }, { transaction });
    const author = await db.User.create(
      {
        name: 'Fixture',
        email: 'fixture@example.invalid',
        hashpass: 'unused',
        roleId: role.id,
      },
      { transaction },
    );
    const tags = await db.Tags.bulkCreate([{ name: 'Один' }, { name: 'Два' }, { name: 'Три' }], {
      transaction,
    });
    const adverts = await db.Advert.bulkCreate(
      Array.from({ length: size }, (_, index) => ({
        title: `Объявление ${index + 1}`,
        body: `Синтетическое описание объявления ${index + 1}. `.repeat(10),
        createdAt: index === 0 ? newer : createdAt,
        updatedAt: createdAt,
        userId: index === size - 1 ? null : author.id,
        price: 20000,
        rooms: 2,
      })),
      { transaction },
    );
    const locations = adverts.slice(0, -1).map(({ id }, index) => ({
      advertId: id,
      city: (index + 1) % 5 === 0 ? 'Казань' : 'Москва',
      district: null,
      metro: null,
    }));
    // The current schema allows duplicate locations despite Sequelize's hasOne association.
    await db.Location.bulkCreate([...locations, locations[size - 3]], { transaction });
    await db.AdvertTags.bulkCreate(
      adverts.flatMap(({ id }, index) => [
        { advertId: id, tagId: tags[0].id },
        { advertId: id, tagId: tags[2].id },
        ...((index + 1) % 2 === 0 ? [{ advertId: id, tagId: tags[1].id }] : []),
      ]),
      { transaction },
    );
    await db.AdvertPhoto.bulkCreate(
      adverts.flatMap(({ id }) =>
        [1, 2, 3].map((number) => ({
          advertId: id,
          photo: `/images/o06/${id}/${number}.webp`,
        })),
      ),
      { transaction },
    );
    return tags;
  });
}

async function run() {
  const size = Number(process.env.O06_ROWS ?? 1000);
  assert.ok([100, 1000].includes(size), 'Choose the O01 fixture size of 100 or 1000.');
  assert.equal(await db.Advert.count(), 0, 'The scratch database must be empty.');
  assert.equal(await db.User.count(), 0, 'The scratch database must be empty.');
  const [version] = await db.sequelize.query('SHOW server_version', {
    type: db.Sequelize.QueryTypes.SELECT,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}/api/listings`;
  const ids = (rows) => rows.map(({ id }) => id);

  async function request(path, filters) {
    const response = await fetch(
      origin + path,
      filters === undefined
        ? undefined
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
          },
    );
    const body = await response.text();
    return { status: response.status, data: JSON.parse(body), bytes: Buffer.byteLength(body) };
  }

  const emptyFresh = await request('/fresh');
  assert.equal(emptyFresh.status, 200);
  assert.deepEqual(emptyFresh.data, []);
  const tags = await seed(size);
  const filters = {
    city: 'Москва',
    priceFrom: 19000,
    priceTo: 21000,
    roomsFrom: 2,
    roomsTo: 2,
    tags: [{ id: tags[0].id }, { id: tags[1].id }, { id: tags[1].id }],
  };
  const expected = Array.from({ length: size }, (_, index) => size - index).filter(
    (id) => id % 2 === 0 && id % 5 !== 0,
  );
  const first = await request('/filters/page', filters);
  const second = await request('/filters/page?page=2', filters);
  const lastPage = Math.ceil(expected.length / 7);
  const last = await request(`/filters/page?page=${lastPage}&limit=7`, filters);
  const beyond = await request(`/filters/page?page=${lastPage + 1}&limit=7`, filters);
  const empty = await request('/filters/page', { ...filters, city: 'Нет результатов' });
  [first, second, last, beyond, empty].forEach((result) => assert.equal(result.status, 200));
  assert.deepEqual(ids(first.data.items), expected.slice(0, 8));
  assert.deepEqual(ids(second.data.items), expected.slice(8, 16));
  assert.deepEqual(ids(last.data.items), expected.slice((lastPage - 1) * 7));
  [first, second, last, beyond].forEach(({ data }) => assert.equal(data.total, expected.length));
  assert.deepEqual(beyond.data, {
    items: [],
    total: expected.length,
    page: lastPage + 1,
    limit: 7,
  });
  assert.deepEqual(empty.data, { items: [], total: 0, page: 1, limit: 8 });
  for (const nonmatching of [
    { priceFrom: 22000, priceTo: 0 },
    { roomsFrom: 3, roomsTo: 0 },
  ]) {
    const result = await request('/filters/page', { ...filters, ...nonmatching });
    assert.equal(result.status, 200);
    assert.equal(result.data.total, 0);
  }
  assert.deepEqual(Object.keys(first.data.items[0].user).sort(), ['email', 'id', 'name']);
  assert.equal(first.data.items[0].location.metro, null);
  assert.equal(first.data.items[0].tags.length, 3);
  const photos = ids(first.data.items[0].AdvertPhotos);
  assert.equal(photos.length, 3);
  assert.deepEqual(
    photos,
    [...photos].sort((a, b) => a - b),
  );

  const fresh = await request('/fresh');
  assert.equal(fresh.status, 200);
  assert.deepEqual(ids(fresh.data), [1, size, size - 1]);
  assert.equal(fresh.data[1].location, null);
  assert.equal(fresh.data[1].user, null);
  assert.deepEqual(ids((await request('/fresh?limit=1')).data), [1]);
  const maximum = await request('/filters/page?limit=50', {});
  assert.equal(maximum.status, 200);
  assert.equal(maximum.data.items.length, 50);
  assert.equal(maximum.data.total, size);

  for (const [path, body] of [
    ['/filters/page?page=0', {}],
    ['/filters/page?page=1&page=2', {}],
    ['/filters/page?limit=51', {}],
    ['/filters/page?limit[]=8', {}],
    ['/filters/page?page=9007199254740991&limit=50', {}],
    ['/fresh?limit=4'],
    ['/fresh?limit=1.5'],
    ['/fresh?limit[]=3'],
  ]) {
    const result = await request(path, body);
    assert.equal(result.status, 400, path);
    assert.equal(result.data.code, 'INVALID_PAGINATION', path);
  }

  // Compare only completed response bodies. The old home route fetched all adverts.
  const samples = [];
  for (let trial = 1; trial <= 5; trial += 1) {
    const searchBefore = await request('/filters', {});
    const searchAfter = await request('/filters/page', {});
    const freshBefore = await request('');
    const freshAfter = await request('/fresh');
    for (const result of [searchBefore, searchAfter, freshBefore, freshAfter]) {
      assert.equal(result.status, 200);
    }
    assert.equal(searchBefore.data.length, size);
    assert.equal(searchAfter.data.total, size);
    assert.deepEqual(ids(searchAfter.data.items), [
      1,
      ...Array.from({ length: 7 }, (_, index) => size - index),
    ]);
    assert.equal(freshBefore.data.length, size);
    assert.deepEqual(ids(freshAfter.data), [1, size, size - 1]);
    const read = (result) => ({
      rows: (result.data.items ?? result.data).length,
      bytes: result.bytes,
    });
    samples.push({
      trial,
      search: { before: read(searchBefore), after: read(searchAfter) },
      fresh: { before: read(freshBefore), after: read(freshAfter) },
    });
  }
  const output = {
    postgres: version.server_version,
    node: process.version,
    adverts: size,
    samples,
  };
  if (process.argv[2]) {
    await writeFile(process.argv[2], JSON.stringify(output, null, 2) + '\n');
  }
  console.log(JSON.stringify(output));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.sequelize.close();
  });
