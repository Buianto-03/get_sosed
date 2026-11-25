import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocketServer } from 'ws';
import { createFixture } from './fixtures.mjs';

const photoSources = ['photo-0', 'photo-1', 'photo-2', 'photo-3', 'listing3-0', 'listing3-1'];

// Historical client bundles still request the former API prefix.
export function normalizeListingApiPath(path) {
  return path.replace(/^\/api\/adverts(?=\/|\?|$)/, '/api/listings');
}

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
  '.webp': 'image/webp',
  '.avif': 'image/avif',
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

export async function serve(root, { photos = false, legacyWire = false } = {}) {
  const assets = await readAssets(root);
  const photoBodies = photos
    ? await Promise.all(
        photoSources.map((name) =>
          readFile(
            new URL(`../../../server/public/images/listings/listing-3/${name}.webp`, import.meta.url),
          ),
        ),
      )
    : [];
  let fixture;
  let release;
  let gate;
  const heldReads = new Map();
  const failedReads = new Set();
  const reads = [];
  const collections = [];
  const failures = [];
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const fixturePath = normalizeListingApiPath(url.pathname);
      let type, compressed, body;
      let status = 200;
      let cache = 'no-store';
      let read;
      if (url.pathname.startsWith('/api/')) {
        let input = '';
        for await (const chunk of req) {
          input += chunk;
        }
        const hold = heldReads.get(fixturePath);
        if (hold) {
          read = {
            path: url.pathname,
            method: req.method,
            canceled: false,
            completed: false,
            bytes: 0,
          };
          reads.push(read);
          res.once('close', () => {
            if (!res.writableEnded) {
              read.canceled = true;
            }
          });
          await hold.promise;
          if (res.destroyed) {
            return;
          }
        }
        const answer = failedReads.delete(fixturePath)
          ? { status: 503, data: { error: 'Synthetic temporary failure' } }
          : fixture.request(
              req.method,
              fixturePath,
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
        const json = JSON.stringify(answer.data);
        body = gzipSync(json);
        if (
          [
            '/api/listings',
            '/api/listings/filters',
            '/api/listings/filters/page',
            '/api/listings/fresh',
          ].includes(fixturePath)
        ) {
          collections.push({
            path: url.pathname + url.search,
            status,
            items: Array.isArray(answer.data) ? answer.data.length : answer.data.items?.length ?? 0,
            total: Array.isArray(answer.data) ? answer.data.length : answer.data.total ?? 0,
            jsonBytes: Buffer.byteLength(json),
            gzipBytes: body.length,
          });
        }
        type = 'application/json';
        compressed = true;
      } else if (photos && /^\/fixture-photos\/[1-9]\d*\/[1-6]\.webp$/.test(url.pathname)) {
        body = photoBodies[Number(url.pathname.match(/(\d)\.webp$/)[1]) - 1];
        type = 'image/webp';
        cache = 'public, max-age=31536000, immutable';
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
      if (read) {
        read.completed = true;
        read.bytes = body.length;
      }
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
    reads,
    collections,
    failNextRead(path) {
      failedReads.add(path);
    },
    holdReads(paths) {
      for (const path of paths) {
        let releaseRead;
        const promise = new Promise((resolve) => {
          releaseRead = resolve;
        });
        heldReads.set(path, { promise, release: releaseRead });
      }
    },
    releaseReads() {
      for (const hold of heldReads.values()) {
        hold.release();
      }
      heldReads.clear();
    },
    reset(size) {
      reads.length = 0;
      collections.length = 0;
      failedReads.clear();
      fixture = createFixture(size, { photos, legacyWire });
    },
    neighbor() {
      fixture.neighbor();
    },
    presence() {
      fixture.presence();
    },
    disconnectWithQueuedMessages(count) {
      fixture.disconnectWithQueuedMessages(count);
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
      for (const hold of heldReads.values()) {
        hold.release();
      }
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
