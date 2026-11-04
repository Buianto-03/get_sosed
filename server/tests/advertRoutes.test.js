const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { Duplex } = require('node:stream');
const vm = require('node:vm');
const express = require('express');

function load(file, dependencies) {
  const filename = path.resolve(__dirname, file);
  const sandbox = {
    __dirname: path.dirname(filename),
    process,
    module: { exports: {} },
    require(name) {
      assert.ok(name in dependencies, name);
      return dependencies[name];
    },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}

function request(app, method, url) {
  return new Promise((resolve, reject) => {
    let data = '';
    const socket = new Duplex({
      read() {},
      write(chunk, encoding, callback) { data += chunk.toString(); callback(); },
    });
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.headers = {};
    const res = new http.ServerResponse(req);
    res.assignSocket(socket);
    res.on('finish', () => {
      const body = data.slice(data.indexOf('\r\n\r\n') + 4);
      resolve({ status: res.statusCode, body: JSON.parse(body) });
    });
    res.on('error', reject);
    app.handle(req, res);
  });
}

test('advert DELETE reaches API fallback while advert GET and like DELETE remain available', async () => {
  const noop = (req, res, next) => next();
  const advertController = {
    getAdverts: noop, createAdvert: noop, getFilteredAdverts: noop,
    likedAdvertsHandler: noop, getTopAdvertsByLikes: noop, getTagsBySearch: noop,
    getMine: noop,
    getAdvertById: (req, res) => res.json({ advertId: req.params.advertId }),
  };
  const likeController = {
    getLikes: noop, setLike: noop,
    deleteLike: (req, res) => res.json({ advertId: Number(req.params.advertId), deleted: true }),
  };
  const advertRouter = load('../build/src/router/advertRouter.js', {
    express,
    '../middlewares/verifyAccessToken': noop,
    '../middlewares/handleUpload': () => noop,
    '../controllers/advertController': advertController,
  });
  const likeRouter = load('../build/src/router/likeRouter.js', {
    express,
    '../middlewares/verifyAccessToken': noop,
    '../controllers/likeController': likeController,
  });
  let app;
  const server = { on() {} };
  load('../build/src/app.js', {
    express,
    morgan: () => noop,
    path,
    http: { createServer: (createdApp) => { app = createdApp; return server; } },
    'cookie-parser': () => noop,
    cors: () => noop,
    './router/tokensRouter': noop,
    './router/authRouter': noop,
    './router/advertRouter': advertRouter,
    './router/userRouter': noop,
    './router/likeRouter': likeRouter,
    './ws/upgrade': noop,
    './ws/wsServer': { on() {} },
    './ws/connection': noop,
  });

  assert.deepEqual(await request(app, 'DELETE', '/api/adverts/42'), {
    status: 404,
    body: { code: 'API_ROUTE_NOT_FOUND', message: 'API route not found' },
  });
  assert.deepEqual(await request(app, 'GET', '/api/adverts/42'), {
    status: 200, body: { advertId: '42' },
  });
  assert.deepEqual(await request(app, 'DELETE', '/api/likes/42'), {
    status: 200, body: { advertId: 42, deleted: true },
  });
});
