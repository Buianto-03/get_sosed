const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Sequelize = require('sequelize');
function load(file, dependencies, globals = {}) {
  const filename = path.resolve(__dirname, file);
  const sandbox = {
    module: { exports: {} },
    require: (name) => {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
    ...globals,
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
  const sideEffects = [];
  const locations = [];
  const tagBatches = [];
  const transaction = {};
  const readIncludes = [];
  const files = new Set();
  const logs = [];
  let writes = 0;
  const db = {
    sequelize: {
      transaction: async (callback) => {
        sideEffects.push('transaction');
        try {
          const result = await callback(transaction);
          sideEffects.push('commit');
          return result;
        } catch (error) {
          rows.length = 0;
          locations.length = 0;
          tagBatches.length = 0;
          images.length = 0;
          sideEffects.push('rollback');
          throw error;
        }
      },
    },
    Tags: {
      findAll: async (query) => {
        assert.equal(query.transaction, transaction);
        return options.unknown
          ? []
          : query.where.id[Sequelize.Op.in].map((id) => ({ id }));
      },
    },
    Advert: {
      create: async (values, query) => {
        assert.equal(query.transaction, transaction);
        rows.push(values);
        return { id: 42 };
      },
      findByPk: async (id, query) => {
        assert.equal(id, 42);
        assert.equal(query.transaction, transaction);
        assert.equal(query.include, readIncludes);
        sideEffects.push('read');
        if (options.readError) {
          throw options.readError;
        }
        return { id, photos: [...images] };
      },
    },
    Location: {
      create: async (values, query) => {
        assert.equal(query.transaction, transaction);
        if (options.locationError) {
          throw options.locationError;
        }
        locations.push(values);
      },
    },
    AdvertTags: {
      bulkCreate: async (values, query) => {
        assert.equal(query.transaction, transaction);
        if (options.tagsError) {
          throw options.tagsError;
        }
        tagBatches.push(values);
      },
    },
    AdvertPhoto: {
      create: async (values, query) => {
        assert.equal(query.transaction, transaction);
        sideEffects.push('photoRecord');
        if (options.photoError) {
          throw options.photoError;
        }
        images.push(values.photo);
      },
    },
  };
  const exported = load('../src/service/publishAdvertService.js', {
    sequelize: Sequelize,
    '../../db/models': {},
    './advertService': {},
    sharp: () => ({
      webp: () => ({
        toBuffer: async () => {
          if (options.invalidPhoto) {
            throw Error('Cannot decode input');
          }
          return Buffer.from('image');
        },
      }),
    }),
    'fs/promises': {
      mkdir: async (directory, args) => {
        sideEffects.push('mkdir');
        assert.equal(directory, './public/images/adverts/advert-42');
        assert.equal(args.recursive, true);
        if (options.mkdirError) {
          throw options.mkdirError;
        }
      },
      writeFile: async (filePath) => {
        sideEffects.push('writeFile');
        files.add(filePath);
        writes += 1;
        if (options.failSecond && writes === 2) {
          throw Error('disk full');
        }
      },
      rm: async (directory, args) => {
        sideEffects.push('rm');
        assert.equal(directory, './public/images/adverts/advert-42');
        assert.equal(args.recursive, true);
        assert.equal(args.force, true);
        if (options.cleanupError) {
          throw options.cleanupError;
        }
        for (const filePath of files) {
          if (filePath.startsWith(`${directory}/`)) {
            files.delete(filePath);
          }
        }
      },
    },
  }, { console: { error: (...args) => logs.push(args) } });
  const service = new exported.constructor(
    db.sequelize,
    db.Advert,
    db.Location,
    db.Tags,
    db.AdvertTags,
    db.AdvertPhoto,
    { getReadIncludes: () => readIncludes },
  );
  return { service, rows, images, sideEffects, locations, tagBatches, files, logs };
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
test('publication rejects invalid photos before opening a transaction or touching files', async () => {
  const cases = [
    { files: undefined, message: 'Add 1–10 photos' },
    { files: {}, message: 'Add 1–10 photos' },
    { files: [], message: 'Add 1–10 photos' },
    { files: Array(11).fill(photos[0]), message: 'Add 1–10 photos' },
    {
      files: [{ ...photos[0], mimetype: 'image/gif' }],
      message: 'Invalid photo',
    },
    {
      files: [{ ...photos[0], size: 10 * 1024 * 1024 + 1 }],
      message: 'Invalid photo',
    },
    { files: photos, invalidPhoto: true, message: 'Cannot decode photo' },
  ];
  for (const { files, invalidPhoto, message } of cases) {
    const env = publication({ invalidPhoto });
    await assert.rejects(
      env.service.publishAdvert(fields, files, 7),
      (error) =>
        error.status === 400 &&
        error.code === 'INVALID_ADVERT_DATA' &&
        error.message === message,
    );
    assert.deepEqual(env.sideEffects, []);
    assert.deepEqual(env.rows, []);
  }
});
test('publication awaits ordered photo writes, deduplicates tags and scopes author to session', async () => {
  const { service, rows, files, sideEffects } = publication();
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
  assert.deepEqual([...files], [
    './public/images/adverts/advert-42/photo-0.webp',
    './public/images/adverts/advert-42/photo-1.webp',
  ]);
  assert.deepEqual(sideEffects, [
    'transaction', 'mkdir', 'writeFile', 'photoRecord',
    'writeFile', 'photoRecord', 'read', 'commit',
  ]);
});
test('publication uses one transaction for all related queries and skips empty tag links', async () => {
  for (const tagIds of ['[1,1,2]', '[]']) {
    const env = publication();
    await env.service.publishAdvert({ ...fields, tagIds, userId: '999' }, photos, 7);
    assert.equal(env.sideEffects.filter((effect) => effect === 'transaction').length, 1);
    assert.equal(env.rows[0].userId, 7);
    assert.equal(env.rows[0].city, undefined);
    assert.equal(env.rows[0].tagIds, undefined);
    assert.equal(env.locations.length, 1);
    assert.equal(env.locations[0].advertId, 42);
    assert.equal(env.locations[0].city, 'Казань');
    assert.equal(env.locations[0].address, 'Улица, 1');
    if (tagIds === '[]') {
      assert.equal(env.tagBatches.length, 0);
    } else {
      assert.equal(env.tagBatches.length, 1);
      assert.deepEqual(
        Array.from(env.tagBatches[0], ({ tagId, advertId }) => ({ tagId, advertId })),
        [{ tagId: 1, advertId: 42 }, { tagId: 2, advertId: 42 }],
      );
    }
  }
});
test('publication rolls back related records and preserves location and tag-link errors before writing photos', async () => {
  for (const operation of ['locationError', 'tagsError']) {
    const failure = new Error(operation);
    const env = publication({ [operation]: failure });
    await assert.rejects(
      env.service.publishAdvert(fields, photos, 7),
      (error) => error === failure,
    );
    assert.deepEqual(env.rows, []);
    assert.deepEqual(env.locations, []);
    assert.deepEqual(env.tagBatches, []);
    assert.deepEqual(env.sideEffects, ['transaction', 'rollback']);
  }
});
test('a second-photo disk failure rolls back database records and removes request-owned files', async () => {
  const { service, rows, images, files, sideEffects } = publication({ failSecond: true });
  await assert.rejects(service.publishAdvert(fields, photos, 7), /disk full/);
  assert.equal(rows.length, 0);
  assert.equal(images.length, 0);
  assert.equal(files.size, 0);
  assert.deepEqual(sideEffects, [
    'transaction', 'mkdir', 'writeFile', 'photoRecord',
    'writeFile', 'rollback', 'rm',
  ]);
});
test('publication cleans up only its directory after mkdir, photo-record and final-read failures', async () => {
  for (const operation of ['mkdirError', 'photoError', 'readError']) {
    const failure = new Error(operation);
    const env = publication({ [operation]: failure });
    const otherFile = './public/images/adverts/advert-99/photo-0.webp';
    env.files.add(otherFile);
    await assert.rejects(
      env.service.publishAdvert(fields, photos, 7),
      (error) => error === failure,
    );
    assert.deepEqual(env.rows, []);
    assert.deepEqual(env.images, []);
    assert.deepEqual(env.locations, []);
    assert.deepEqual(env.tagBatches, []);
    assert.deepEqual([...env.files], [otherFile]);
    assert.deepEqual(env.sideEffects.slice(-2), ['rollback', 'rm']);
    assert.deepEqual(env.logs, []);
  }
});
test('publication logs cleanup failures without replacing the original photo-record error', async () => {
  const failure = new Error('photo record failed');
  const cleanupError = new Error('cannot remove files');
  const env = publication({ photoError: failure, cleanupError });
  await assert.rejects(
    env.service.publishAdvert(fields, photos, 7),
    (error) => error === failure,
  );
  assert.deepEqual(env.rows, []);
  assert.deepEqual(env.images, []);
  assert.deepEqual(env.sideEffects.slice(-2), ['rollback', 'rm']);
  assert.deepEqual([...env.files], ['./public/images/adverts/advert-42/photo-0.webp']);
  assert.deepEqual(env.logs, [
    ['Cannot remove advert photos after rollback:', cleanupError],
  ]);
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
  const exported = load('../src/service/userService.js', {
    sequelize: Sequelize,
    '../../db/models': {},
  });
  const user = {};
  const userProfile = {};
  const createdAt = '2026-10-21T10:00:00.000Z';
  const latest = { id: 4, senderId: 1, receiverId: 2, createdAt };
  const otherLatest = { id: 3, senderId: 3, receiverId: 1, createdAt };
  const reverse = { id: 2, senderId: 2, receiverId: 1, createdAt };
  const sameDirection = { id: 1, senderId: 1, receiverId: 2, createdAt };
  const cases = [
    { rows: [], expected: [] },
    { rows: [latest, sameDirection], expected: [latest] },
    { rows: [latest, reverse], expected: [latest] },
    { rows: [latest, otherLatest, reverse, sameDirection], expected: [latest, otherLatest] },
  ];
  for (const { rows, expected } of cases) {
    const chat = {
      findAll: async (options) => {
        assert.deepEqual(
          Array.from(options.where[Sequelize.Op.or], (condition) => ({ ...condition })),
          [{ senderId: 1 }, { receiverId: 1 }],
        );
        assert.deepEqual(
          Array.from(options.order, (order) => Array.from(order)),
          [['createdAt', 'DESC'], ['id', 'DESC']],
        );
        assert.deepEqual(Array.from(options.include, ({ as }) => as), ['receiver', 'sender']);
        for (const participant of options.include) {
          assert.equal(participant.model, user);
          assert.deepEqual(Array.from(participant.attributes), ['id', 'name', 'email']);
          assert.equal(participant.include[0].model, userProfile);
          assert.deepEqual(Array.from(participant.include[0].attributes), ['photo']);
        }
        return rows;
      },
    };
    const service = new exported.constructor(user, userProfile, chat);
    const result = Array.from(await service.getReceiverUsers(1));
    assert.deepEqual(result, expected);
    result.forEach((message, index) => assert.equal(message, expected[index]));
  }
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
