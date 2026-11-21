import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir, cpus, arch, platform, release, totalmem } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import assert from 'node:assert/strict';
import { buildClient } from './profile-build.mjs';
import { openChrome } from './chrome.mjs';
import { serve } from './local-server.mjs';
import { observePage } from './browser-metrics.mjs';
import { routes, measureRoute, interact, checkHistoryPagination } from './scenarios.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    route: { type: 'string' },
    size: { type: 'string' },
    mode: { type: 'string' },
  },
});
assert.equal(
  positionals.length,
  1,
  'Run in client/: node scripts/optimization-profile/run.mjs /tmp/o01.json [--route /messages/2] [--size large] [--mode profile]',
);
const [destination] = positionals;

function select(name, choices) {
  const value = values[name];
  if (value === undefined) {
    return choices;
  }
  assert.ok(choices.includes(value), `--${name} must be one of: ${choices.join(', ')}`);
  return [value];
}

const selection = {
  modes: select('mode', ['production', 'profile']),
  sizes: select('size', ['small', 'large']),
  routes: select('route', routes),
};
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
  ...(Object.keys(values).length > 0 && { selection }),
  samples: [],
};
let browser;
try {
  // Build the selected modes before sampling to avoid concurrent build CPU activity.
  for (const mode of selection.modes) {
    await buildClient(join(temporary, mode), mode === 'profile');
  }
  const userData = join(temporary, 'chrome');
  await mkdir(userData);
  browser = await openChrome(userData, binary);
  result.chrome = browser.version;
  for (const mode of selection.modes) {
    const profile = mode === 'profile';
    const server = await serve(join(temporary, mode));
    try {
      for (let trial = 1; trial <= trials; trial++) {
        for (const size of selection.sizes) {
          for (const route of selection.routes) {
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
                  if (route === '/messages/2') {
                    sample.historyPagination = await checkHistoryPagination(page, server, size);
                  }
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
  assert.equal(
    result.samples.length,
    trials * selection.modes.length * selection.sizes.length * selection.routes.length * 2,
  );
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
