import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

assert.ok(process.argv[2], 'node scripts/optimization-profile/cancellation-report.mjs OUTPUT.json');
const { trials, samples, baseline, commit } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[0] === sorted.at(-1) ? median : `${median} [${sorted[0]}–${sorted.at(-1)}]`;
}
const rows = [];
for (const variant of new Set(samples.map((sample) => sample.variant))) {
  for (const size of ['small', 'large']) {
    for (const scenario of ['search', 'leave-detail']) {
      const group = samples.filter(
        (s) => s.variant === variant && s.size === size && s.scenario === scenario,
      );
      assert.equal(group.length, trials);
      assert.equal(new Set(group.map((s) => s.trial)).size, trials);
      rows.push([
        variant,
        size,
        scenario,
        summarize(group.map((s) => s.canceled)),
        summarize(group.map((s) => s.completed)),
        summarize(group.map((s) => s.bodyBytes)),
      ]);
    }
  }
}
console.log(`Baseline: ${baseline}; working-tree base: ${commit}; trials: ${trials}\n`);
console.log(
  [
    ['Версия', 'Набор', 'Сценарий', 'Отменено', 'Завершено', 'gzip JSON, байт'],
    Array(6).fill('---'),
    ...rows,
  ]
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n'),
);
