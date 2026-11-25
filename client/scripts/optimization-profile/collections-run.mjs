// O07: compare collection payloads through real production routes on O01 fixtures.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir, cpus } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { buildClient, usesLegacyListingWire } from './profile-build.mjs';
import { openChrome } from './chrome.mjs';
import { serve } from './local-server.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { baseline: { type: 'string' } },
});
assert.equal(
  positionals.length,
  1,
  'node scripts/optimization-profile/collections-run.mjs OUTPUT.json [--baseline COMMIT]',
);
const trials = Number(process.env.TRIALS ?? 5);
assert.ok(Number.isSafeInteger(trials) && trials > 0);
const baseline = values.baseline
  ? execFileSync('git', ['rev-parse', values.baseline], { encoding: 'utf8' }).trim()
  : null;
const variants = baseline ? ['before', 'after'] : ['current'];
const legacyWire = usesLegacyListingWire(baseline);
const temporary = await mkdtemp(join(tmpdir(), 'get-sosed-o07-'));
const result = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  baseline,
  trials,
  started: new Date().toISOString(),
  node: process.version,
  cpu: cpus()[0].model,
  viewport: [1440, 900],
  dpr: 1,
  samples: [],
  browserChecks: [],
};
const more = `Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Показать ещё')`;
const cards = 'document.querySelectorAll("article button[aria-pressed]").length';
let browser;

function summary(requests) {
  return {
    requests: requests.map((r) => ({ ...r })),
    requestCount: requests.length,
    items: requests.reduce((sum, r) => sum + r.items, 0),
    jsonBytes: requests.reduce((sum, r) => sum + r.jsonBytes, 0),
    gzipBytes: requests.reduce((sum, r) => sum + r.gzipBytes, 0),
  };
}
async function openRoute(page, server, route) {
  await page.send('Page.navigate', { url: server.origin + route });
  await page.wait(`${cards} === ${route === '/' ? 3 : 8}`);
  await page.evaluate('document.fonts.ready.then(() => true)');
  await page.wait(
    `Array.from(document.querySelectorAll('article button[aria-pressed]')).every(b => !b.disabled)`,
  );
  await page.wait(
    `performance.getEntriesByType('resource').filter(r => new URL(r.name).pathname.startsWith('/api/')).every(r => r.responseEnd > 0)`,
  );
}
function checkErrors(page, server) {
  assert.equal(server.failures.length, 0, server.failures.join('\n'));
  assert.equal(page.diagnostics.length, 0, page.diagnostics.join('\n'));
}
try {
  for (const variant of variants) {
    await buildClient(join(temporary, variant), false, variant === 'before' ? baseline : undefined);
  }
  browser = await openChrome(
    join(temporary, 'chrome'),
    process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  );
  result.chrome = browser.version;
  for (const variant of variants) {
    const server = await serve(join(temporary, variant), {
      legacyWire: variant === 'before' && legacyWire,
    });
    try {
      for (let trial = 1; trial <= trials; trial++) {
        for (const size of ['small', 'large']) {
          for (const route of ['/', '/listings']) {
            server.reset(size);
            const page = await browser.newPage();
            try {
              await openRoute(page, server, route);
              const bounded = variant !== 'before';
              const initial = summary(server.collections);
              assert.equal(initial.requestCount, 1);
              assert.equal(
                initial.items,
                bounded ? (route === '/' ? 3 : 8) : size === 'small' ? 100 : 1000,
              );
              const resources = await page.evaluate(`performance.getEntriesByType('resource')
                .filter(r => ${JSON.stringify(server.collections.map((r) => r.path))}.includes(new URL(r.name).pathname + new URL(r.name).search))
                .map(r => ({path: new URL(r.name).pathname + new URL(r.name).search, encodedBodySize: r.encodedBodySize, decodedBodySize: r.decodedBodySize}))`);
              assert.equal(
                resources.reduce((sum, r) => sum + r.encodedBodySize, 0),
                initial.gzipBytes,
              );
              assert.equal(
                resources.reduce((sum, r) => sum + r.decodedBodySize, 0),
                initial.jsonBytes,
              );
              result.samples.push({
                variant,
                trial,
                size,
                scenario: route === '/' ? 'home' : 'search-first',
                ...initial,
                resources,
              });
              if (route === '/listings') {
                const countLabel = await page.evaluate(
                  `document.querySelector('#search-results-heading').parentElement.textContent`,
                );
                assert.ok(countLabel.includes(size === 'small' ? '100' : '1000'));
                await page.evaluate(`${more}.focus(); ${more}.click()`);
                await page.wait(`${cards} === 16`);
                await page.wait(
                  `document.activeElement === document.querySelectorAll('article')[8].querySelector('button')`,
                );
                const next = summary(server.collections.slice(initial.requestCount));
                assert.equal(next.requestCount, bounded ? 1 : 0);
                assert.equal(next.items, bounded ? 8 : 0);
                result.samples.push({ variant, trial, size, scenario: 'search-more', ...next });
              }
              checkErrors(page, server);
            } finally {
              await page.close();
            }
          }
        }
        console.error(`O07 ${variant} ${trial}/${trials}`);
      }
      if (variant !== 'before') {
        // Responsive layout and actual asynchronous keyboard focus, outside payload samples.
        for (const [width, height] of [
          [1440, 900],
          [390, 844],
        ]) {
          server.reset('large');
          const page = await browser.newPage();
          try {
            await page.send('Emulation.setDeviceMetricsOverride', {
              width,
              height,
              deviceScaleFactor: 1,
              mobile: width < 500,
            });
            await openRoute(page, server, '/listings');
            server.failNextRead('/api/listings/filters/page');
            await page.evaluate(`${more}.focus(); ${more}.click()`);
            await page.wait(
              `document.querySelector('[role=alert]')?.textContent.includes('Не удалось загрузить следующие')`,
            );
            await page.wait(`document.activeElement?.textContent === 'Повторить загрузку'`);
            assert.equal(await page.evaluate(cards), 8);
            assert.deepEqual(server.failures.splice(0), ['POST /api/listings/filters/page 503']);
            server.holdReads(['/api/listings/filters/page']);
            await page.evaluate(`document.activeElement.click()`);
            await page.wait(
              `Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Загрузка') && b.disabled)`,
            );
            assert.equal(await page.evaluate(cards), 8);
            server.releaseReads();
            await page.wait(`${cards} === 16`);
            await page.wait(
              `document.activeElement === document.querySelectorAll('article')[8].querySelector('button')`,
            );
            assert.equal(server.collections.at(-2).path, server.collections.at(-1).path);
            const overflow = await page.evaluate(
              'document.documentElement.scrollWidth > innerWidth',
            );
            assert.equal(overflow, false);
            const screenshot = join(dirname(resolve(positionals[0])), `o07-search-${width}.png`);
            const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
            await writeFile(screenshot, Buffer.from(data, 'base64'));
            result.browserChecks.push({
              width,
              height,
              cards: 16,
              focusOnFirstAdded: true,
              retrySamePage: true,
              focusOnRetryAfterError: true,
              overflow,
              screenshot: `o07-search-${width}.png`,
            });
            checkErrors(page, server);
          } finally {
            server.releaseReads();
            await page.close();
          }
        }
      }
    } finally {
      await server.close();
    }
  }
  result.finished = new Date().toISOString();
  await writeFile(resolve(positionals[0]), JSON.stringify(result) + '\n');
  console.error('Wrote ' + resolve(positionals[0]));
} finally {
  await browser?.close();
  await rm(temporary, { recursive: true, force: true });
}
