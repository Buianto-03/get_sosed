// O05: measure catalog reuse across real search/publication route mounts.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir, cpus } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { buildClient } from './profile-build.mjs';
import { openChrome } from './chrome.mjs';
import { normalizeListingApiPath, serve } from './local-server.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { baseline: { type: 'string' } },
});
assert.equal(
  positionals.length,
  1,
  'node scripts/optimization-profile/tag-catalog-run.mjs OUTPUT.json --baseline COMMIT',
);
const trials = Number(process.env.TRIALS ?? 5);
assert.ok(Number.isSafeInteger(trials) && trials > 0);
const baseline = values.baseline
  ? execFileSync('git', ['rev-parse', values.baseline], { encoding: 'utf8' }).trim()
  : null;
const variants = baseline ? ['before', 'after'] : ['current'];
const temporary = await mkdtemp(join(tmpdir(), 'get-sosed-o05-'));
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
};
let browser;
async function until(condition) {
  const start = Date.now();
  while (!(await condition())) {
    assert.ok(Date.now() - start < 10000, 'Timed out waiting for fixture requests');
    await delay(10);
  }
}
async function navigate(page, path) {
  await page.evaluate(
    `history.pushState(null, '', ${JSON.stringify(path)}); window.dispatchEvent(new PopStateEvent('popstate'))`,
  );
  await page.wait(`location.pathname === ${JSON.stringify(path)}`);
}
async function publicationRules(page) {
  await page.wait("document.querySelector('#listing-title') !== null");
  for (const [id, text] of [
    ['title', 'Комната'],
    ['city', 'Москва'],
    ['address', 'Улица, 1'],
    ['area', '18'],
    ['rooms', '2'],
    ['floor', '3'],
  ]) {
    await page.evaluate(
      `document.querySelector('#listing-${id}').focus(); document.querySelector('#listing-${id}').select()`,
    );
    await page.send('Input.insertText', { text });
    await page.wait(`document.querySelector('#listing-${id}').value === ${JSON.stringify(text)}`);
  }
  await page.evaluate(
    `Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Продолжить').click()`,
  );
  await page.wait("document.querySelectorAll('input[type=checkbox]:enabled').length === 4");
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
    const server = await serve(join(temporary, variant));
    try {
      for (let trial = 1; trial <= trials; trial++) {
        for (const size of ['small', 'large']) {
          for (const scenario of ['navigation', 'in-flight-navigation']) {
            server.reset(size);
            const page = await browser.newPage();
            try {
              await page.send('Page.navigate', { url: server.origin + '/about' });
              await page.wait(
                "document.querySelector('h1')?.textContent.includes('Комфортный дом')",
              );
              await page.evaluate('document.fonts.ready.then(() => true)');
              await until(() =>
                page
                  .network()
                  .requests.some(
                    (r) => normalizeListingApiPath(r.path) === '/api/listings/liked' && Number.isFinite(r.transfer),
                  ),
              );
              if (scenario === 'in-flight-navigation') {
                server.holdReads(['/api/listings/tags']);
              }
              await navigate(page, '/listings');
              if (scenario === 'navigation') {
                await page.wait(
                  `document.querySelectorAll('input[type=checkbox]:enabled').length === ${size === 'large' ? 200 : 20}`,
                );
              } else {
                await until(() => server.reads.length === 1);
              }
              await navigate(page, '/listings/new');
              if (scenario === 'in-flight-navigation') {
                await page.wait("document.querySelector('#listing-title') !== null");
                if (variant === 'before') {
                  await until(() => server.reads.length === 2 && server.reads[0].canceled);
                } else {
                  // Allow passive effects to settle; the new subscriber must join the existing read.
                  await page.evaluate(
                    'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
                  );
                  await delay(100);
                  assert.equal(server.reads.length, 1);
                  assert.equal(server.reads[0].canceled, false);
                }
                server.releaseReads();
              }
              await publicationRules(page);
              if (scenario === 'navigation') {
                await navigate(page, '/listings');
                await page.wait(
                  `document.querySelectorAll('input[type=checkbox]:enabled').length === ${size === 'large' ? 200 : 20}`,
                );
              }
              await page.evaluate(
                'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
              );
              const readTagRequests = () => page.network().requests.filter(
                ({ path }) => normalizeListingApiPath(path).startsWith('/api/listings/tags'),
              );
              await until(() => readTagRequests().every(
                (r) => Number.isFinite(r.transfer) ||
                  (scenario === 'in-flight-navigation' && variant === 'before' && !r.status),
              ));
              const requests = readTagRequests();
              const tagPaths = requests.map(({ path }) => path);
              const resources = await page.evaluate(`performance.getEntriesByType('resource')
                .filter(r => ${JSON.stringify(tagPaths)}.includes(new URL(r.name).pathname + new URL(r.name).search))
                .map(r => ({ encoded: r.encodedBodySize, decoded: r.decodedBodySize, transfer: r.transferSize }))`);
              const expected = variant === 'before' ? (scenario === 'navigation' ? 3 : 2) : 1;
              assert.equal(requests.length, expected);
              assert.equal(server.failures.length, 0, server.failures.join('\n'));
              assert.equal(page.diagnostics.length, 0, page.diagnostics.join('\n'));
              assert.equal(
                await page.evaluate("document.querySelectorAll('[role=alert]').length"),
                0,
              );
              result.samples.push({
                variant,
                trial,
                size,
                scenario,
                requests,
                count: requests.length,
                bodyBytes: resources.reduce((sum, r) => sum + r.encoded, 0),
                canceled: server.reads.filter((r) => r.canceled).length,
                resources,
              });
            } finally {
              server.releaseReads();
              await page.close();
            }
          }
        }
        console.error(`O05 ${variant} ${trial}/${trials}`);
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
