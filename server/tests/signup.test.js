const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(options = {}) {
  const rows = [];
  const files = new Set();
  let profile;
  let sharpCalls = 0;
  let mkdirCalls = 0;
  const dependencies = {
    bcrypt: { hash: async () => 'secret-hash' },
    'fs/promises': {
      mkdir: async (_, args) => { assert.equal(args.recursive, true); mkdirCalls += 1; },
      writeFile: async (name) => { files.add(name); if (options.writeError) throw Error('disk'); },
      rm: async (name) => { files.delete(name); },
    },
    sharp: () => {
      sharpCalls += 1;
      if (options.invalidPhoto) throw Error('invalid');
      return { webp: () => ({ toBuffer: async () => Buffer.from('photo') }) };
    },
    '../../db/models': {
      sequelize: { transaction: async (callback) => {
        try { return await callback({ id: 'transaction' }); }
        catch (error) { rows.length = 0; profile = undefined; throw error; }
      } },
      User: {
        findOne: async () => options.duplicate ? { id: 1 } : null,
        create: async (values, { transaction }) => {
          assert.ok(transaction);
          if (options.race) throw Object.assign(Error('unique'), { name: 'SequelizeUniqueConstraintError' });
          rows.push({ ...values, id: 8, roleId: 2, internalFlag: true }); return rows[0];
        },
        findByPk: async (_, { transaction, attributes, include }) => {
          assert.ok(transaction);
          assert.ok(Array.isArray(attributes));
          assert.ok(Array.isArray(include[0].attributes));
          assert.equal(include[0].model, models.UserProfile);
          return { get: () => ({
            ...Object.fromEntries(attributes.map((field) => [field, rows[0][field]])),
            UserProfile: Object.fromEntries(include[0].attributes.map((field) => [field, profile[field]])),
          }) };
        },
      },
      UserProfile: { create: async (values, { transaction }) => {
        assert.ok(transaction);
        if (options.profileError) throw Error('profile');
        profile = { ...values, internalFlag: true };
      } },
    },
  };
  const models = dependencies['../../db/models'];
  dependencies['../../db/models'] = {};
  const sandbox = { module: { exports: {} }, require: (name) => {
    assert.ok(name in dependencies, name); return dependencies[name];
  } };
  const filename = path.resolve(__dirname, '../src/service/signupService.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  const service = new sandbox.module.exports.constructor(models.sequelize, models.User, models.UserProfile);
  return { service, rows, files, sharpCalls: () => sharpCalls, mkdirCalls: () => mkdirCalls };
}
const body = { name: ' Анна ', email: ' anna@example.com ', password: 'password1' };

test('signup without file/gender creates nullable profile and selects only public response fields', async () => {
  const env = setup();
  const user = await env.service.signup(body);
  assert.equal(user.name, 'Анна');
  assert.equal(user.email, 'anna@example.com');
  assert.equal(user.UserProfile.photo, null);
  assert.equal(user.UserProfile.gender, null);
  assert.equal(user.hashpass, undefined);
  assert.equal(user.internalFlag, undefined);
  assert.equal(user.UserProfile.internalFlag, undefined);
  assert.equal(env.rows[0].hashpass, 'secret-hash');
  assert.equal(user.roleId, 2);
  assert.equal(env.sharpCalls(), 0);
  assert.equal(env.mkdirCalls(), 0);
});

test('validates required fields and password digit/length before inserting', async () => {
  for (const invalid of [{ name: '' }, { name: [] }, { email: 'bad' }, { password: undefined },
    { password: 'short1' }, { password: 'no-digits' }, { gender: 'unexpected' }]) {
    const env = setup();
    await assert.rejects(env.service.signup({ ...body, ...invalid }), (error) =>
      error.status === 400 && error.code === 'INVALID_SIGNUP_DATA' && error.message === 'Invalid signup data');
    assert.equal(env.rows.length, 0);
  }
});

test('duplicate email and concurrent unique conflict return 409', async () => {
  for (const options of [{ duplicate: true }, { race: true }]) {
    const env = setup(options);
    await assert.rejects(env.service.signup(body), (error) =>
      error.status === 409 && error.code === 'EMAIL_ALREADY_EXISTS' && error.message === 'Email already exists');
    assert.equal(env.rows.length, 0);
  }
});

test('keeps compatibility with multipart photo/gender', async () => {
  const env = setup();
  const user = await env.service.signup({ ...body, gender: 'female' }, { buffer: Buffer.from('photo') });
  assert.equal(user.UserProfile.gender, 'female');
  assert.equal(user.UserProfile.photo, '/images/users/user-8/user-8.webp');
  assert.equal(env.files.size, 1);
});

test('invalid photo, disk or profile failure never leaves a partially created account or file', async () => {
  for (const options of [{ invalidPhoto: true }, { writeError: true }, { profileError: true }]) {
    const env = setup(options);
    await assert.rejects(env.service.signup(body, { buffer: Buffer.from('photo') }), (error) => {
      if (options.invalidPhoto) {
        return error.status === 400 && error.code === 'INVALID_PHOTO' && error.message === 'Invalid photo';
      }
      return error.message === (options.writeError ? 'disk' : 'profile');
    });
    assert.equal(env.rows.length, 0);
    assert.equal(env.files.size, 0);
  }
});
