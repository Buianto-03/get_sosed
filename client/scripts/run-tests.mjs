import { build } from 'esbuild';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const testDir = resolve('tests');
const entries = (await readdir(testDir)).filter((name) => name.endsWith('.test.ts'));
const output = await mkdtemp(join(tmpdir(), 'get-sosed-tests-'));

try {
  await build({
    entryPoints: entries.map((name) => join(testDir, name)),
    outdir: output,
    platform: 'node',
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    bundle: true,
    define: { 'import.meta.env': '{}' },
  });
  const result = spawnSync(process.execPath, ['--test', ...entries.map((name) => join(output, name.replace(/\.ts$/, '.cjs')))], {
    stdio: 'inherit',
  });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(output, { recursive: true, force: true });
}
