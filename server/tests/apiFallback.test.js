const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('unknown API requests return 404 JSON with API_ROUTE_NOT_FOUND', () => {
  const middleware = [];
  const noop = () => {};
  const app = { use: (...args) => middleware.push(args), get: noop };
  const server = { on: noop };
  const express = () => app;
  express.static = express.urlencoded = express.json = () => noop;
  const dependencies = {
    express,
    morgan: () => noop,
    path,
    http: { createServer: () => server },
    'cookie-parser': () => noop,
    cors: () => noop,
    './router/tokensRouter': noop,
    './router/authRouter': noop,
    './router/advertRouter': noop,
    './router/userRouter': noop,
    './router/likeRouter': noop,
    './ws/upgrade': noop,
    './ws/wsServer': { on: noop },
    './ws/connection': noop,
  };
  const filename = path.resolve(__dirname, '../src/app.js');
  const sandbox = {
    __dirname: path.dirname(filename),
    module: { exports: {} },
    require(name) {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  assert.equal(sandbox.module.exports, server);
  const handler = middleware.find(([route]) => route === '/api')[1];
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  handler({ method: 'GET', url: '/unknown' }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(JSON.stringify(res.body), JSON.stringify({
    code: 'API_ROUTE_NOT_FOUND', message: 'API route not found',
  }));
});
