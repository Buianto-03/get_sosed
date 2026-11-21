import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocketServer } from 'ws';
import { createFixture } from './fixtures.mjs';

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

async function readAssets(root) {
  const assets = new Map();
  for (const relative of await readdir(root, { recursive: true, withFileTypes: true })) {
    if (!relative.isFile()) {
      continue;
    }
    const filename = join(relative.parentPath, relative.name);
    const pathname = filename.slice(root.length);
    const body = await readFile(filename);
    const type = mime[extname(filename)] ?? 'application/octet-stream';
    const compressed = type.startsWith('text/') || type === 'image/svg+xml';
    assets.set(pathname, { type, compressed, body: compressed ? gzipSync(body) : body });
  }
  return assets;
}

export async function serve(root) {
  const assets = await readAssets(root);
  let fixture;
  let release;
  let gate;
  const failures = [];
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let type, compressed, body;
      let status = 200;
      let cache = 'no-store';
      if (url.pathname.startsWith('/api/')) {
        let input = '';
        for await (const chunk of req) {
          input += chunk;
        }
        const answer = fixture.request(
          req.method,
          url.pathname,
          url.searchParams,
          input ? JSON.parse(input) : undefined,
        );
        if (answer.delayMs) {
          await delay(answer.delayMs);
        }
        if (
          (req.method === 'POST' || req.method === 'DELETE') &&
          url.pathname.startsWith('/api/likes/')
        ) {
          await gate;
        }
        status = answer.status;
        body = gzipSync(JSON.stringify(answer.data));
        type = 'application/json';
        compressed = true;
      } else {
        const asset =
          assets.get(url.pathname) ?? (!extname(url.pathname) && assets.get('/index.html'));
        if (asset) {
          ({ type, compressed, body } = asset);
          if (type !== 'text/html') {
            cache = 'public, max-age=31536000, immutable';
          }
        } else {
          status = 404;
          body = Buffer.alloc(0);
          type = 'text/plain';
        }
      }
      if (status >= 400) {
        failures.push(`${req.method} ${url.pathname} ${status}`);
      }
      res.writeHead(status, {
        'Content-Type': type,
        'Content-Length': body.length,
        'Cache-Control': cache,
        ...(compressed ? { 'Content-Encoding': 'gzip' } : {}),
      });
      res.end(body);
    } catch (error) {
      failures.push(error.stack);
      res.writeHead(500).end();
    }
  });
  const sockets = new WebSocketServer({ server, path: '/ws', perMessageDeflate: false });
  sockets.on('connection', (socket) => fixture.connect(socket));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    origin: 'http://127.0.0.1:' + server.address().port,
    failures,
    reset(size) {
      fixture = createFixture(size);
    },
    neighbor() {
      fixture.neighbor();
    },
    presence() {
      fixture.presence();
    },
    holdLike() {
      gate = new Promise((resolve) => {
        release = resolve;
      });
    },
    releaseLike() {
      release?.();
      gate = undefined;
    },
    async close() {
      release?.();
      for (const socket of sockets.clients) {
        socket.terminate();
      }
      sockets.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
