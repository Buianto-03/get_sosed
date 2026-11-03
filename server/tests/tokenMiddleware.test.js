const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');
const verifyAccessToken = require('../build/src/middlewares/verifyAccessToken');
const verifyRefreshToken = require('../build/src/middlewares/verifyRefreshToken');

function response() {
  return {
    locals: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    clearCookie(name) {
      this.clearedCookie = name;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
  };
}

test('access middleware exposes the verified user and rejects missing or invalid tokens', (t) => {
  const previousSecret = process.env.ACCESS_TOKEN_SECRET;
  process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.ACCESS_TOKEN_SECRET;
    } else {
      process.env.ACCESS_TOKEN_SECRET = previousSecret;
    }
  });

  const user = { id: 7, name: 'Anna' };
  const token = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET);
  const res = response();
  let nextCalls = 0;
  verifyAccessToken(
    { headers: { authorization: `Bearer ${token}` } },
    res,
    () => {
      nextCalls += 1;
    },
  );
  assert.deepEqual(res.locals.user, user);
  assert.equal(nextCalls, 1);

  for (const authorization of [undefined, 'Bearer invalid']) {
    const invalidRes = response();
    verifyAccessToken({ headers: { authorization } }, invalidRes, () => {
      assert.fail('Unexpected next');
    });
    assert.equal(invalidRes.statusCode, 403);
    assert.equal(invalidRes.body, 'Invalid access token');
  }
});

test('refresh middleware exposes the user and clears an invalid cookie', (t) => {
  const previousSecret = process.env.REFRESH_TOKEN_SECRET;
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.REFRESH_TOKEN_SECRET;
    } else {
      process.env.REFRESH_TOKEN_SECRET = previousSecret;
    }
  });

  const user = { id: 7, name: 'Anna' };
  const token = jwt.sign({ user }, process.env.REFRESH_TOKEN_SECRET);
  const res = response();
  let nextCalls = 0;
  verifyRefreshToken({ cookies: { refreshToken: token } }, res, () => {
    nextCalls += 1;
  });
  assert.deepEqual(res.locals.user, user);
  assert.equal(nextCalls, 1);

  const invalidRes = response();
  verifyRefreshToken(
    { cookies: { refreshToken: 'invalid' } },
    invalidRes,
    () => {
      assert.fail('Unexpected next');
    },
  );
  assert.equal(invalidRes.statusCode, 401);
  assert.equal(invalidRes.clearedCookie, 'refreshToken');
});

test('both token middlewares validate signed payloads and preserve compatible user data', (t) => {
  t.mock.method(console, 'log', () => {});
  const previousSecrets = {
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  };
  process.env.ACCESS_TOKEN_SECRET = 'payload-access-secret';
  process.env.REFRESH_TOKEN_SECRET = 'payload-refresh-secret';
  t.after(() => {
    for (const [key, value] of Object.entries(previousSecrets)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  const invalidPayloads = [
    {},
    { user: null },
    { user: [] },
    { user: '7' },
    { user: {} },
    { user: { id: '7' } },
    { user: { id: 0 } },
    { user: { id: -1 } },
    { user: { id: 1.5 } },
    { user: { id: Number.MAX_SAFE_INTEGER + 1 } },
    { user: { id: 7, name: 42 } },
  ];
  for (const [middleware, secret, status, request] of [
    [verifyAccessToken, process.env.ACCESS_TOKEN_SECRET, 403,
      (token) => ({ headers: { authorization: `Bearer ${token}` } })],
    [verifyRefreshToken, process.env.REFRESH_TOKEN_SECRET, 401,
      (token) => ({ cookies: { refreshToken: token } })],
  ]) {
    for (const payload of invalidPayloads) {
      const res = response();
      middleware(request(jwt.sign(payload, secret)), res, () => {
        assert.fail('Malformed token user reached a handler');
      });
      assert.equal(res.statusCode, status);
      assert.equal(res.locals.user, undefined);
      if (status === 401) {
        assert.equal(res.clearedCookie, 'refreshToken');
      }
    }

    for (const user of [
      { id: 7 },
      { id: 7, name: null },
      { id: 7, name: 'Anna', email: 'anna@example.com', roleId: 2,
        UserProfile: { photo: '/images/photo.webp', habits: ['No smoking'] } },
    ]) {
      const res = response();
      let nextCalls = 0;
      middleware(request(jwt.sign({ user }, secret)), res, () => {
        nextCalls += 1;
      });
      assert.equal(nextCalls, 1);
      assert.deepEqual(res.locals.user, user);
    }
  }
});
