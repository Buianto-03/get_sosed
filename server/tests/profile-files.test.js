const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ writeError, updateError, cleanupError, previousPhoto = '/images/users/user-7/old.webp' } = {}) {
  const events = [];
  const logs = [];
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const result = { id: 7 };
  let reads = 0;
  let savedValues;
  const dependencies = {
    crypto: { randomUUID: () => 'new-photo' },
    sharp: () => ({ webp: () => ({ toBuffer: async () => Buffer.from('webp') }) }),
    'fs/promises': {
      mkdir: async () => { events.push('mkdir'); },
      writeFile: async () => {
        events.push('write');
        if (writeError) {
          throw writeError;
        }
      },
      rm: async (filePath) => {
        events.push(`remove:${filePath}`);
        if (cleanupError) {
          throw cleanupError;
        }
      },
    },
    '../../db/models': {},
  };
  const sandbox = {
    module: { exports: {} },
    require: (name) => { assert.ok(name in dependencies, name); return dependencies[name]; },
    console: { error: (...args) => logs.push(args) },
  };
  const filename = path.resolve(__dirname, '../build/src/service/profileService.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  const service = new sandbox.module.exports.constructor(
    { transaction: async (callback) => {
      try {
        const value = await callback(transaction);
        events.push('commit');
        return value;
      } catch (error) {
        events.push('rollback');
        throw error;
      }
    } },
    { findByPk: async () => (++reads === 1 ? {} : result) },
    { findOrCreate: async () => [{
      photo: previousPhoto,
      update: async (values) => {
        events.push('update');
        savedValues = { ...values };
        if (updateError) {
          throw updateError;
        }
      },
    }] },
  );
  return { service, result, events, logs, savedValues: () => savedValues };
}
const photo = { size: 10, buffer: Buffer.from('source') };

test('photo replacement writes the new file and removes the old file only after commit', async () => {
  const { service, result, events, savedValues } = setup();
  assert.equal(await service.editProfile(7, {}, photo), result);
  assert.equal(savedValues().photo, '/images/users/user-7/new-photo.webp');
  assert.deepEqual(events, ['mkdir', 'write', 'update', 'commit', 'remove:./public/images/users/user-7/old.webp']);
});

test('photo removal clears the stored URL and removes only an owned WebP file after commit', async () => {
  for (const previousPhoto of ['/images/users/user-7/old.webp', '/images/users/user-8/old.webp', 'https://example.invalid/photo.webp']) {
    const { service, events, savedValues } = setup({ previousPhoto });
    await service.editProfile(7, { removePhoto: 'true' });
    assert.equal(savedValues().photo, null);
    assert.deepEqual(events, previousPhoto === '/images/users/user-7/old.webp'
      ? ['update', 'commit', `remove:./public${previousPhoto}`]
      : ['update', 'commit']);
  }
});

test('failed file writes and failed profile updates clean up the new file after rollback without removing the old photo', async () => {
  for (const stage of ['writeError', 'updateError']) {
    const failure = new Error(stage);
    const { service, events, logs } = setup({ [stage]: failure });
    await assert.rejects(service.editProfile(7, {}, photo), (error) => error === failure);
    assert.deepEqual(events.slice(-2), ['rollback', 'remove:./public/images/users/user-7/new-photo.webp']);
    assert.ok(!events.includes('remove:./public/images/users/user-7/old.webp'));
    assert.deepEqual(logs, []);
  }
});

test('cleanup failures keep the committed result or the original rollback error and are logged', async () => {
  const cleanupError = new Error('cannot remove file');
  const committed = setup({ cleanupError });
  assert.equal(await committed.service.editProfile(7, {}, photo), committed.result);
  assert.deepEqual(committed.logs, [['Cannot remove previous profile photo:', cleanupError]]);
  const updateError = new Error('cannot update profile');
  const rolledBack = setup({ cleanupError, updateError });
  await assert.rejects(rolledBack.service.editProfile(7, {}, photo), (error) => error === updateError);
  assert.deepEqual(rolledBack.logs, [['Cannot remove profile photo after rollback:', cleanupError]]);
});
