import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir, cpus, arch, platform, release, totalmem } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { buildClient } from './profile-build.mjs';
import { openChrome } from './chrome.mjs';
import { serve } from './local-server.mjs';
import { observePage } from './browser-metrics.mjs';
import { routes, measureRoute, interact } from './scenarios.mjs';

const destination = process.argv[2];
assert.ok(destination, 'Run in client/: node scripts/optimization-profile/run.mjs /tmp/o01.json');
const trials = Number(process.env.TRIALS ?? 5);
assert.ok(Number.isSafeInteger(trials) && trials > 0, 'TRIALS must be a positive integer');
const binary =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const temporary = await mkdtemp(join(tmpdir(), 'get-sosed-o01-'));
const result = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  started: new Date().toISOString(),
  node: process.version,
  os: platform(),
  kernel: release(),
  arch: arch(),
  cpu: cpus()[0].model,
  logicalCores: cpus().length,
  ramBytes: totalmem(),
  viewport: [1440, 900],
  dpr: 1,
  trials,
  samples: [],
};
let browser;
try {
  // Build both before the benchmark to avoid build CPU activity during sampling.
  for (const mode of ['production', 'profile']) {
    await buildClient(join(temporary, mode), mode === 'profile');
  }
  const userData = join(temporary, 'chrome');
  await mkdir(userData);
  browser = await openChrome(userData, binary);
  result.chrome = browser.version;
  for (const mode of ['production', 'profile']) {
    const profile = mode === 'profile';
    const server = await serve(join(temporary, mode));
    try {
      for (let trial = 1; trial <= trials; trial++) {
        for (const size of ['small', 'large']) {
          for (const route of routes) {
            server.reset(size);
            const page = await browser.newPage();
            try {
              await page.send('Page.addScriptToEvaluateOnNewDocument', {
                source: `(${observePage.toString()})(${profile})`,
              });
              for (const cache of ['cold', 'warm']) {
                const sample = {
                  mode,
                  size,
                  route,
                  trial,
                  cache,
                  ...(await measureRoute(page, server, route, size, profile)),
                };
                if (profile && cache === 'warm') {
                  sample.interactions = await interact(page, server, route);
                }
                result.samples.push(sample);
              }
            } finally {
              await page.close();
            }
          }
        }
        console.error(`${mode} ${trial}/${trials}`);
      }
    } finally {
      await server.close();
    }
  }
  result.finished = new Date().toISOString();
  assert.equal(result.samples.length, trials * 32);
  await writeFile(resolve(destination), JSON.stringify(result) + '\n');
  console.error('Wrote ' + resolve(destination));
} finally {
  try {
    if (browser) {
      await browser.close();
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
