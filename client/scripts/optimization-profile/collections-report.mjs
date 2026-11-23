import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

assert.ok(process.argv[2], 'node scripts/optimization-profile/collections-report.mjs OUTPUT.json');
const { trials, samples, baseline, commit } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[0] === sorted.at(-1) ? median : `${median} [${sorted[0]}–${sorted.at(-1)}]`;
}
const rows = [];
for (const variant of new Set(samples.map((s) => s.variant))) {
  for (const size of ['small', 'large']) {
    for (const scenario of ['home', 'search-first', 'search-more']) {
      const group = samples.filter(
        (s) => s.variant === variant && s.size === size && s.scenario === scenario,
      );
      assert.equal(group.length, trials);
      assert.equal(new Set(group.map((s) => s.trial)).size, trials);
      rows.push([
        variant,
        size,
        scenario,
        ...['requestCount', 'items', 'jsonBytes', 'gzipBytes'].map((key) =>
          summarize(group.map((s) => s[key])),
        ),
      ]);
    }
  }
}
console.log(`Baseline: ${baseline}; working-tree base: ${commit}; trials: ${trials}\n`);
console.log(
  [
    ['Версия', 'Набор', 'Сценарий', 'Запросы', 'Записи', 'JSON, байт', 'gzip JSON, байт'],
    Array(7).fill('---'),
    ...rows,
  ]
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n'),
);
