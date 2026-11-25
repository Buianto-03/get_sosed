// Compare actual client disconnects and response bytes, not just AbortSignal flags.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
  'node scripts/optimization-profile/cancellation-run.mjs OUTPUT.json --baseline COMMIT',
);
const trials = Number(process.env.TRIALS ?? 5);
assert.ok(Number.isSafeInteger(trials) && trials > 0);
const baseline = values.baseline
  ? execFileSync('git', ['rev-parse', values.baseline], { encoding: 'utf8' }).trim()
  : null;
const variants = baseline ? ['before', 'after'] : ['current'];
const temporary = await mkdtemp(join(tmpdir(), 'get-sosed-o04-'));
const result = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  baseline,
  trials,
  started: new Date().toISOString(),
  node: process.version,
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
  await page.evaluate(`history.pushState(null, '', ${JSON.stringify(path)});
    window.dispatchEvent(new PopStateEvent('popstate'))`);
  await page.wait(`location.pathname === ${JSON.stringify(path.split('?')[0])}`);
}
async function applyCity(page, city) {
  await page.evaluate(`(() => {
    const input = document.querySelector('input[placeholder="Любой город"]');
    input.focus(); input.select();
  })()`);
  await page.send('Input.insertText', { text: city });
  await page.wait(
    `document.querySelector('input[placeholder="Любой город"]').value === ${JSON.stringify(city)}`,
  );
  await page.evaluate(
    `document.querySelector('input[placeholder="Любой город"]').form.requestSubmit()`,
  );
  await page.wait(`new URLSearchParams(location.search).get('city') === ${JSON.stringify(city)}`);
}
try {
  // Complete all builds before collecting comparable samples.
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
          for (const scenario of ['search', 'leave-detail']) {
            server.reset(size);
            const page = await browser.newPage();
            try {
              // Establish the session before starting; do not mix auth initialization into reads.
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
              if (scenario === 'search') {
                server.holdReads(['/api/listings/filters', '/api/listings/filters/page']);
                await navigate(page, '/listings');
                await page.wait(
                  `document.querySelectorAll('input[type=checkbox]:enabled').length === ${size === 'large' ? 200 : 20}`,
                );
                await until(() => server.reads.length === 1);
                await applyCity(page, 'Москва');
                await until(() => server.reads.length === 2);
                await applyCity(page, 'Казань');
                await until(() => server.reads.length === 3);
              } else {
                server.holdReads(['/api/listings/1', '/api/likes/1']);
                await navigate(page, '/listings/1');
                await until(() => server.reads.length === 2);
                await navigate(page, '/about');
                await page.wait(
                  "document.querySelector('h1')?.textContent.includes('Комфортный дом')",
                );
              }
              if (variant !== 'before') {
                await until(() => server.reads.filter((r) => r.canceled).length === 2);
              }
              server.releaseReads();
              await until(() => server.reads.every((r) => r.completed || r.canceled));
              if (scenario === 'search') {
                await page.wait(
                  "document.querySelectorAll('article button[aria-pressed]:enabled').length === 8",
                );
                assert.equal(
                  await page.evaluate("new URLSearchParams(location.search).get('city')"),
                  'Казань',
                );
              }
              assert.equal(
                await page.evaluate("document.querySelectorAll('[role=alert]').length"),
                0,
              );
              assert.equal(server.failures.length, 0, server.failures.join('\n'));
              assert.equal(page.diagnostics.length, 0, page.diagnostics.join('\n'));
              const requests = server.reads.map((read) => ({ ...read }));
              result.samples.push({
                variant,
                trial,
                size,
                scenario,
                requests,
                canceled: requests.filter((r) => r.canceled).length,
                completed: requests.filter((r) => r.completed).length,
                bodyBytes: requests.reduce((sum, r) => sum + r.bytes, 0),
              });
            } finally {
              server.releaseReads();
              await page.close();
            }
          }
        }
        console.error(`O04 ${variant} ${trial}/${trials}`);
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
