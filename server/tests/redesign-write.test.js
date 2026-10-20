const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Sequelize = require('sequelize');
function load(file, dependencies) {
  const filename = path.resolve(__dirname, file);
  const sandbox = {
    module: { exports: {} },
    require: (name) => {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}
const fields = {
  title: 'Комната',
  body: 'Описание жилья',
  city: 'Казань',
  address: 'Улица, 1',
  square: '18',
  rooms: '2',
  floor: '3',
  price: '25000',
  tagIds: '[1,1,2]',
};
function publication(options = {}) {
  const rows = [];
  const images = [];
  let writes = 0;
  const db = {
    sequelize: {
      transaction: async (callback) => {
        try {
          return await callback({});
        } catch (error) {
          rows.length = 0;
          throw error;
        }
      },
    },
    Tags: {
      findAll: async () => (options.unknown ? [] : [{ id: 1 }, { id: 2 }]),
    },
    Advert: {
      create: async (values) => {
        rows.push(values);
        return { id: 42 };
      },
      findByPk: async () => ({ id: 42, photos: [...images] }),
    },
    Location: { create: async () => undefined },
    AdvertTags: { bulkCreate: async () => undefined },
    AdvertPhoto: {
      create: async (values) => {
        images.push(values.photo);
      },
    },
  };
  const exported = load('../src/service/publishAdvertService.js', {
    sequelize: Sequelize,
    '../../db/models': {},
    './advertService': {},
    sharp: () => ({
      webp: () => ({ toBuffer: async () => Buffer.from('image') }),
    }),
    'fs/promises': {
      mkdir: async () => undefined,
      writeFile: async () => {
        writes += 1;
        if (options.failSecond && writes === 2) throw Error('disk full');
      },
      rm: async () => {
        images.length = 0;
      },
    },
  });
  const service = new exported.constructor(
    db.sequelize,
    db.Advert,
    db.Location,
    db.Tags,
    db.AdvertTags,
    db.AdvertPhoto,
    { getReadIncludes: () => [] },
  );
  return { service, rows, images };
}
const photos = [1, 2].map(() => ({
  mimetype: 'image/png',
  size: 10,
  buffer: Buffer.from('photo'),
}));
test('publication validates numeric fields, actual tag IDs and photos before leaving any records', async () => {
  const { service, rows } = publication();
  for (const invalid of [
    { rooms: '1.5' },
    { floor: 'Infinity' },
    { price: '-1' },
    { address: '' },
    { tagIds: '["1"]' },
    { tagIds: '{' },
  ]) {
    await assert.rejects(
      service.publishAdvert({ ...fields, ...invalid }, photos, 7),
      (error) => error.status === 400 && error.code === 'INVALID_ADVERT_DATA',
    );
  }
  await assert.rejects(
    service.publishAdvert(fields, [], 7),
    (error) => error.status === 400 && error.code === 'INVALID_ADVERT_DATA',
  );
  const unknown = publication({ unknown: true });
  await assert.rejects(
    unknown.service.publishAdvert(fields, photos, 7),
    (error) => error.status === 400 && error.code === 'INVALID_ADVERT_DATA',
  );
  assert.equal(rows.length, 0);
  assert.equal(unknown.rows.length, 0);
});
test('publication awaits ordered photo writes, deduplicates tags and scopes author to session', async () => {
  const { service, rows } = publication();
  assert.equal(service.parseAdvert(fields).tagIds.length, 2);
  const result = await service.publishAdvert(
    { ...fields, userId: '999' },
    photos,
    7,
  );
  assert.equal(rows[0].userId, 7);
  assert.deepEqual(result.photos, [
    '/images/adverts/advert-42/photo-0.webp',
    '/images/adverts/advert-42/photo-1.webp',
  ]);
});
test('a second-photo disk failure rolls back database records and removes request-owned files', async () => {
  const { service, rows, images } = publication({ failSecond: true });
  await assert.rejects(service.publishAdvert(fields, photos, 7), /disk full/);
  assert.equal(rows.length, 0);
  assert.equal(images.length, 0);
});
test('profile allowlist preserves omitted fields and rejects malformed habits and incompatible photo modes', async () => {
  const service = load('../src/service/profileService.js', {
    crypto: { randomUUID: () => 'photo' },
    'fs/promises': {},
    sharp: {},
    '../../db/models': {},
  });
  assert.deepEqual(
    Object.keys(
      service.parseProfile({
        roleId: '1',
        userId: '999',
        photo: 'http://example.invalid',
      }),
    ),
    [],
  );
  assert.equal(service.parseProfile({ age: '' }).age, null);
  assert.equal(service.parseProfile({ city: ' Казань ' }).city, 'Казань');
  for (const body of [
    { habits: '{}' },
    { habits: '[1]' },
    { age: '17' },
    { age: '1.5' },
    { removePhoto: 'yes' },
    { phoneNumber: 'bad' },
  ]) {
    assert.throws(
      () => service.parseProfile(body),
      (error) => error.status === 400 && error.code === 'INVALID_PROFILE_DATA',
    );
  }
  await assert.rejects(
    service.editProfile(
      1,
      { removePhoto: 'true' },
      { buffer: Buffer.from('image') },
    ),
    (error) => error.status === 400 && error.code === 'INVALID_PROFILE_DATA',
  );
});
test('profile updates use injected models and keep all database operations in the same transaction', async () => {
  const exported = load('../src/service/profileService.js', {
    crypto: {},
    'fs/promises': {},
    sharp: {},
    '../../db/models': {},
  });
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const result = { id: 7, name: 'Anna', UserProfile: { city: 'Казань' } };
  const writes = [];
  let reads = 0;
  const user = {
    findByPk: async (id, options) => {
      assert.equal(id, 7);
      assert.equal(options.transaction, transaction);
      reads += 1;
      if (reads === 1) {
        assert.equal(options.lock, transaction.LOCK.UPDATE);
        return { update: async (values, options) => {
          assert.equal(options.transaction, transaction);
          writes.push({ ...values });
        } };
      }
      assert.ok(Array.isArray(options.attributes));
      assert.ok(Array.isArray(options.include[0].attributes));
      assert.equal(options.include[0].model, userProfile);
      const userFields = { ...result, hashpass: 'private-hash', internalFlag: true };
      const profileFields = { ...result.UserProfile, internalFlag: true };
      const selected = {
        ...Object.fromEntries(options.attributes.map((field) => [field, userFields[field]])),
        UserProfile: Object.fromEntries(options.include[0].attributes.map((field) => [field, profileFields[field]])),
      };
      assert.equal(selected.hashpass, undefined);
      assert.equal(selected.internalFlag, undefined);
      assert.equal(selected.UserProfile.internalFlag, undefined);
      return result;
    },
  };
  const userProfile = {
    findOrCreate: async (options) => {
      assert.equal(options.where.userId, 7);
      assert.equal(options.transaction, transaction);
      return [{ update: async (values, options) => {
        assert.equal(options.transaction, transaction);
        writes.push({ ...values });
      } }];
    },
  };
  const service = new exported.constructor(
    { transaction: async (callback) => callback(transaction) },
    user,
    userProfile,
  );
  assert.equal(await service.editProfile(7, { name: ' Anna ', city: ' Казань ' }), result);
  assert.deepEqual(writes, [{ name: 'Anna' }, { city: 'Казань' }]);
  assert.equal(reads, 2);
});

test('conversation list queries latest messages first and returns one latest row per other participant', async () => {
  const rows = [
    { id: 4, senderId: 1, receiverId: 2 },
    { id: 3, senderId: 3, receiverId: 1 },
    { id: 2, senderId: 2, receiverId: 1 },
  ];
  const service = load('../src/service/userService.js', {
    sequelize: Sequelize,
    '../../db/models': {
      User: {},
      UserProfile: {},
      Chat: {
        findAll: async (options) => {
          assert.equal(
            JSON.stringify(options.order),
            JSON.stringify([
              ['createdAt', 'DESC'],
              ['id', 'DESC'],
            ]),
          );
          return rows;
        },
      },
    },
  });
  assert.deepEqual(
    Array.from(await service.getReceiverUsers(1), (row) => row.id),
    [4, 3],
  );
});

test('profile photo preparation skips absent photos and rejects conflicting or oversized uploads before decoding', async () => {
  let decodes = 0;
  const service = load('../src/service/profileService.js', {
    crypto: {},
    'fs/promises': {},
    sharp: () => { decodes += 1; throw new Error('unexpected decode'); },
    '../../db/models': {},
  });
  assert.equal(await service.preparePhoto(undefined, false), undefined);
  assert.equal(await service.preparePhoto(undefined, true), undefined);
  for (const [file, removePhoto] of [
    [{ size: 10, buffer: Buffer.from('photo') }, true],
    [{ size: 5 * 1024 * 1024 + 1, buffer: Buffer.from('photo') }, false],
  ]) {
    await assert.rejects(service.preparePhoto(file, removePhoto),
      (error) => error.status === 400 && error.code === 'INVALID_PROFILE_DATA');
  }
  assert.equal(decodes, 0);
});

test('profile photo preparation converts uploads at the size limit to WebP and rejects undecodable images', async () => {
  const source = Buffer.from('source');
  const image = Buffer.from('webp');
  let invalidImage = false;
  const service = load('../src/service/profileService.js', {
    crypto: {},
    'fs/promises': {},
    sharp: (buffer) => {
      assert.equal(buffer, source);
      return { webp: () => ({ toBuffer: async () => {
        if (invalidImage) {
          throw new Error('decode failed');
        }
        return image;
      } }) };
    },
    '../../db/models': {},
  });
  const file = { size: 5 * 1024 * 1024, buffer: source };
  assert.equal(await service.preparePhoto(file, false), image);
  invalidImage = true;
  await assert.rejects(service.preparePhoto(file, false),
    (error) => error.status === 400 && error.code === 'INVALID_PROFILE_DATA');
});
