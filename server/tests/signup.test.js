const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(options = {}) {
  const rows = [];
  const files = new Set();
  const events = [];
  const logs = [];
  const hashInputs = [];
  const checkedEmails = [];
  const transaction = { id: 'transaction' };
  let profile;
  let sharpCalls = 0;
  let mkdirCalls = 0;
  const dependencies = {
    bcrypt: {
      hash: async (password, rounds) => {
        events.push('hash');
        hashInputs.push({ password, rounds });
        return 'secret-hash';
      },
    },
    'fs/promises': {
      mkdir: async (directory, args) => {
        events.push('mkdir');
        assert.equal(directory, './public/images/users/user-8');
        assert.equal(args.recursive, true);
        mkdirCalls += 1;
        if (options.mkdirError) {
          throw options.mkdirError;
        }
      },
      writeFile: async (name, image) => {
        events.push('write');
        assert.equal(image.toString(), 'photo');
        files.add(name);
        if (options.writeError) {
          throw options.writeError;
        }
      },
      rm: async (name, args) => {
        events.push('remove');
        assert.equal(name, './public/images/users/user-8/user-8.webp');
        assert.equal(args.force, true);
        assert.equal(args.recursive, undefined);
        if (options.cleanupError) {
          throw options.cleanupError;
        }
        files.delete(name);
      },
    },
    sharp: () => {
      events.push('decode');
      sharpCalls += 1;
      return {
        webp: () => ({
          toBuffer: async () => {
            if (options.invalidPhoto) {
              throw new Error('invalid');
            }
            return Buffer.from('photo');
          },
        }),
      };
    },
    '../../db/models': {
      sequelize: {
        transaction: async (callback) => {
          events.push('transaction');
          try {
            const result = await callback(transaction);
            events.push('commit');
            return result;
          } catch (error) {
            rows.length = 0;
            profile = undefined;
            events.push('rollback');
            throw error;
          }
        },
      },
      User: {
        findOne: async ({ where }) => {
          events.push('email');
          checkedEmails.push(where.email);
          return options.duplicate ? { id: 1 } : null;
        },
        create: async (values, query) => {
          assert.equal(query.transaction, transaction);
          events.push('createUser');
          if (options.race) {
            throw Object.assign(new Error('unique'), {
              name: 'SequelizeUniqueConstraintError',
            });
          }
          rows.push({ ...values, id: 8, roleId: 2, internalFlag: true });
          return rows[0];
        },
        findByPk: async (id, query) => {
          const { attributes, include } = query;
          assert.equal(id, 8);
          assert.equal(query.transaction, transaction);
          events.push('readUser');
          if (options.readError) {
            throw options.readError;
          }
          assert.ok(Array.isArray(attributes));
          assert.ok(Array.isArray(include[0].attributes));
          assert.equal(include[0].model, models.UserProfile);
          return {
            get: (args) => {
              assert.equal(args.plain, true);
              return {
                ...Object.fromEntries(attributes.map((field) => [field, rows[0][field]])),
                UserProfile: Object.fromEntries(include[0].attributes.map((field) => [field, profile[field]])),
              };
            },
          };
        },
      },
      UserProfile: {
        create: async (values, query) => {
          assert.equal(query.transaction, transaction);
          events.push('createProfile');
          if (options.profileError) {
            throw options.profileError;
          }
          profile = { ...values, internalFlag: true };
        },
      },
    },
  };
  const models = dependencies['../../db/models'];
  dependencies['../../db/models'] = {};
  const sandbox = {
    module: { exports: {} },
    require: (name) => {
      if (name === '../utils/appError') {
        return require('../build/src/utils/appError');
      }
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
    console: { error: (...args) => logs.push(args) },
  };
  const filename = path.resolve(__dirname, '../build/src/service/signupService.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  const service = new sandbox.module.exports.constructor(models.sequelize, models.User, models.UserProfile);
  return {
    service,
    rows,
    files,
    events,
    logs,
    hashInputs,
    checkedEmails,
    sharpCalls: () => sharpCalls,
    mkdirCalls: () => mkdirCalls,
  };
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
    assert.deepEqual(env.events, []);
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

test('photo, directory, disk, profile and final-read failures never leave a partial account or file', async () => {
  for (const options of [
    { invalidPhoto: true },
    { mkdirError: new Error('mkdir') },
    { writeError: new Error('disk') },
    { profileError: new Error('profile') },
    { readError: new Error('read') },
  ]) {
    const env = setup(options);
    await assert.rejects(env.service.signup(body, { buffer: Buffer.from('photo') }), (error) => {
      if (options.invalidPhoto) {
        return error.status === 400 && error.code === 'INVALID_PHOTO' && error.message === 'Invalid photo';
      }
      return error === (
        options.mkdirError || options.writeError || options.profileError || options.readError
      );
    });
    assert.equal(env.rows.length, 0);
    assert.equal(env.files.size, 0);
  }
});

test('signup normalizes only name and email and keeps preparation before one transaction', async () => {
  const env = setup();
  const password = ' password1 ';
  const user = await env.service.signup(
    { ...body, email: ' Anna@Example.com ', password, gender: '' },
    { buffer: Buffer.from('photo') },
  );
  assert.equal(user.name, 'Анна');
  assert.equal(user.email, 'Anna@Example.com');
  assert.equal(user.UserProfile.gender, null);
  assert.equal(user.get, undefined);
  assert.deepEqual(env.checkedEmails, ['Anna@Example.com']);
  assert.deepEqual(env.hashInputs, [{ password, rounds: 10 }]);
  assert.deepEqual(env.events, [
    'email', 'decode', 'hash', 'transaction', 'createUser',
    'mkdir', 'write', 'createProfile', 'readUser', 'commit',
  ]);
});

test('duplicate email is rejected before decoding a photo or hashing a password', async () => {
  const env = setup({ duplicate: true, invalidPhoto: true });
  await assert.rejects(
    env.service.signup(body, { buffer: Buffer.from('photo') }),
    (error) => error.status === 409 && error.code === 'EMAIL_ALREADY_EXISTS',
  );
  assert.deepEqual(env.events, ['email']);
});

test('signup removes only its new photo after rollback and preserves other user files', async () => {
  const failure = new Error('profile failed');
  const env = setup({ profileError: failure });
  const otherPhoto = './public/images/users/user-8/other.webp';
  env.files.add(otherPhoto);
  await assert.rejects(
    env.service.signup(body, { buffer: Buffer.from('photo') }),
    (error) => error === failure,
  );
  assert.deepEqual([...env.files], [otherPhoto]);
  assert.deepEqual(env.events.slice(-2), ['rollback', 'remove']);
  assert.deepEqual(env.logs, []);
});

test('signup logs cleanup failures and preserves the original error or unique-conflict response', async () => {
  const failures = [
    new Error('profile failed'),
    Object.assign(new Error('unique'), { name: 'SequelizeUniqueConstraintError' }),
  ];
  for (const failure of failures) {
    const cleanupError = new Error('cannot remove photo');
    const env = setup({ profileError: failure, cleanupError });
    await assert.rejects(
      env.service.signup(body, { buffer: Buffer.from('photo') }),
      (error) => failure.name === 'SequelizeUniqueConstraintError'
        ? error.status === 409 && error.code === 'EMAIL_ALREADY_EXISTS'
        : error === failure,
    );
    assert.deepEqual(env.rows, []);
    assert.deepEqual(env.events.slice(-2), ['rollback', 'remove']);
    assert.deepEqual([...env.files], ['./public/images/users/user-8/user-8.webp']);
    assert.deepEqual(env.logs, [
      ['Cannot remove signup photo after rollback:', cleanupError],
    ]);
  }
});
