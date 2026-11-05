const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

function readCookieConfig(value) {
  const env = { ...process.env };

  if (value === undefined) {
    delete env.COOKIE_SECURE;
  } else {
    env.COOKIE_SECURE = value;
  }

  const output = execFileSync(
    process.execPath,
    [
      '-e',
      "console.log(JSON.stringify(require('./build/src/configs/cookiesConfig')))",
    ],
    { cwd: process.cwd(), env, encoding: 'utf8' },
  );

  return JSON.parse(output);
}

test('cookie защищена по умолчанию', () => {
  const config = readCookieConfig(undefined);

  assert.equal(config.secure, true);
  assert.equal(config.httpOnly, true);
  assert.equal(config.sameSite, 'lax');
});

test('локальное исключение отключает Secure', () => {
  const config = readCookieConfig('false');

  assert.equal(config.secure, false);
});

test('другие значения не отключают Secure', () => {
  const config = readCookieConfig('true');

  assert.equal(config.secure, true);
});