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
