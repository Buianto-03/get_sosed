// Production-only O02 measurements, using the O01 browser and observer.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir, cpus } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { buildClient } from './profile-build.mjs';
import { openChrome } from './chrome.mjs';
import { serve } from './local-server.mjs';
import { observePage } from './browser-metrics.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    viewport: { type: 'string' },
    size: { type: 'string' },
    route: { type: 'string' },
    screenshots: { type: 'string' },
    placeholders: { type: 'boolean', default: false },
    verify: { type: 'boolean', default: false },
  },
});
assert.equal(positionals.length, 1, 'node scripts/optimization-profile/media-run.mjs OUTPUT.json');
const viewports = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
};
const ready = {
  '/': "document.querySelectorAll('article button[aria-pressed]:enabled').length === 3",
  '/about': "document.querySelector('h1')?.textContent.includes('Комфортный дом')",
  '/listings': "document.querySelectorAll('article button[aria-pressed]:enabled').length === 8",
  '/listings/1': "document.querySelector('h1')?.textContent === 'Тестовое объявление 1'",
  '/profile': "document.querySelectorAll('section[aria-labelledby=favorites] article').length > 0",
  '/messages/2': "document.querySelectorAll('[data-message-id]').length === 50",
};
function select(key, choices) {
  if (values[key] === undefined) {
    return choices;
  }
  assert.ok(choices.includes(values[key]), `Unknown ${key}: ${values[key]}`);
  return [values[key]];
}
const selection = {
  viewports: select('viewport', Object.keys(viewports)),
  sizes: select('size', ['small', 'large']),
  routes: select('route', Object.keys(ready)),
};
const trials = Number(process.env.TRIALS ?? 5);
assert.ok(Number.isSafeInteger(trials) && trials > 0);
const temporary = await mkdtemp(join(tmpdir(), 'get-sosed-o02-'));
const result = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  started: new Date().toISOString(),
  node: process.version,
  cpu: cpus()[0].model,
  photos: !values.placeholders,
  trials,
  selection,
  viewports,
  samples: [],
};
let browser;
let server;
async function screenshot(page, name) {
  if (values.screenshots) {
    await mkdir(resolve(values.screenshots), { recursive: true });
    const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(resolve(values.screenshots), name + '.png'), Buffer.from(data, 'base64'));
  }
}
async function exerciseMedia(page, viewport, route) {
  if (route === '/listings/1') {
    await page.evaluate(
      `(() => { const opener = document.querySelector('button[aria-label="Открыть фото 1 из 6"]'); opener.focus(); opener.click(); })()`,
    );
    await page.wait("document.querySelector('[role=dialog] img')?.naturalWidth > 0");
    await screenshot(page, viewport + '-lightbox');
    await page.evaluate(
      `document.querySelector('[role=dialog] button[aria-label="Следующее фото"]').click()`,
    );
    await page.wait(
      "document.querySelector('[role=dialog] img')?.src.endsWith('/2.webp') && document.querySelector('[role=dialog] img')?.complete",
    );
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
    await page.wait("!document.querySelector('[role=dialog]')");
    assert.equal(
      await page.evaluate(`document.activeElement?.getAttribute('aria-label')`),
      'Открыть фото 1 из 6',
    );
    if (viewport === 'mobile') {
      await page.evaluate(`document.querySelector('button[aria-label="Следующее фото"]').click()`);
      await page.wait(
        `document.querySelector('button[aria-label="Открыть фото 3 из 6"] img')?.naturalWidth > 0`,
      );
      await page.evaluate(`document.querySelector('button[aria-label="Открыть фото 6 из 6"]')
        .scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' })`);
      await page.wait(
        `document.querySelector('button[aria-label="Открыть фото 6 из 6"] img')?.naturalWidth > 0`,
      );
    }
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await delay(150);
    await screenshot(page, viewport + '-detail-scrolled');
  } else if (route === '/listings') {
    await page.evaluate(
      `document.querySelector('article button[aria-label="Следующее фото"]').click()`,
    );
    await page.wait(
      `Array.from(document.querySelectorAll('article img')).some((img) => img.src.endsWith('/1/2.webp') && img.naturalWidth > 0)`,
    );
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await delay(650);
    await screenshot(page, viewport + '-search-scrolled');
  }
}
try {
  await buildClient(join(temporary, 'dist'), false);
  server = await serve(join(temporary, 'dist'), { photos: result.photos });
  browser = await openChrome(
    join(temporary, 'chrome'),
    process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  );
  result.chrome = browser.version;
  for (let trial = 1; trial <= trials; trial++) {
    for (const viewport of selection.viewports) {
      for (const size of selection.sizes) {
        for (const route of selection.routes) {
          server.reset(size);
          const page = await browser.newPage();
          try {
            await page.send('Emulation.setDeviceMetricsOverride', viewports[viewport]);
            await page.send('Page.addScriptToEvaluateOnNewDocument', {
              source: `(${observePage.toString()})(false)`,
            });
            for (const cache of ['cold', 'warm']) {
              await page.send('Page.navigate', { url: 'about:blank' });
              await page.wait(
                "location.href === 'about:blank' && document.readyState === 'complete'",
              );
              page.resetNetwork();
              await page.send('Page.navigate', { url: server.origin + route });
              await page.wait(
                `location.pathname === ${JSON.stringify(route)} && (${ready[route]})`,
              );
              await page.evaluate('document.fonts.ready.then(() => true)');
              await page.wait(`Array.from(document.images).filter((img) => {
                const r = img.getBoundingClientRect();
                return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0
                  && r.left < innerWidth && r.right > 0;
              }).every((img) => img.complete && img.naturalWidth > 0)`);
              await delay(650);
              const metrics = await page.evaluate('__measure.route()');
              const media = await page.evaluate(`({
                fonts: Array.from(document.fonts, (font) => ({
                  family: font.family, status: font.status, weight: font.weight })),
                images: Array.from(document.images, (img) => {
                  const r = img.getBoundingClientRect();
                  return { src: new URL(img.currentSrc || img.src).pathname,
                    loading: img.loading, priority: img.fetchPriority,
                    width: r.width, height: r.height, top: r.top, left: r.left,
                    loaded: img.complete && img.naturalWidth > 0 };
                }), overflow: document.documentElement.scrollWidth > innerWidth,
              })`);
              const network = page.network();
              assert.ok(metrics.lcp > 0);
              assert.equal(server.failures.length, 0, server.failures.join('\n'));
              assert.equal(page.diagnostics.length, 0, page.diagnostics.join('\n'));
              assert.ok(
                network.requests.every((r) => Number.isFinite(r.transfer) && r.status < 400),
                JSON.stringify(network.requests.filter((r) => !Number.isFinite(r.transfer))),
              );
              if (values.verify) {
                assert.equal(media.overflow, false, `Horizontal overflow: ${viewport} ${route}`);
                assert.ok(
                  media.fonts.some(
                    (font) => font.family.includes('GETSOSED') && font.status === 'loaded',
                  ),
                );
                if (route === '/listings/1' && result.photos) {
                  const expected = viewport === 'desktop' ? [1, 2, 3] : [1];
                  const requested = network.requests
                    .filter((request) => request.path.startsWith('/fixture-photos/1/'))
                    .map((request) => Number(request.path.match(/(\d)\.webp$/)[1]))
                    .sort();
                  assert.deepEqual(requested, expected, 'Hidden gallery photos were requested');
                }
              }
              result.samples.push({
                trial,
                viewport,
                size,
                route,
                cache,
                ...metrics,
                ...media,
                ...network,
              });
              if (trial === 1 && size === selection.sizes[0] && cache === 'warm') {
                await screenshot(page, viewport + (route.replaceAll('/', '-') || '-home'));
              }
            }
            if (trial === 1 && result.photos) {
              await exerciseMedia(page, viewport, route);
            }
          } finally {
            await page.close();
          }
        }
      }
    }
    console.error(`O02 ${trial}/${trials}`);
  }
  result.finished = new Date().toISOString();
  await writeFile(resolve(positionals[0]), JSON.stringify(result) + '\n');
  console.error('Wrote ' + resolve(positionals[0]));
} finally {
  await browser?.close();
  await server?.close();
  await rm(temporary, { recursive: true, force: true });
}
