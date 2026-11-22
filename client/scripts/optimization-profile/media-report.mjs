import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const source = process.argv[2];
assert.ok(source, 'node scripts/optimization-profile/media-report.mjs OUTPUT.json[.gz]');
const raw = readFileSync(source);
const data = JSON.parse(source.endsWith('.gz') ? gunzipSync(raw) : raw);
const sum = (values) => values.reduce((a, b) => a + b, 0);
function summary(values, digits = 1) {
  const ordered = [...values].sort((a, b) => a - b);
  assert.ok(ordered.length && ordered.every(Number.isFinite));
  const n = ordered.length;
  const median = n % 2 ? ordered[n >> 1] : (ordered[n / 2 - 1] + ordered[n / 2]) / 2;
  const format = (value) => Number(value.toFixed(digits));
  return `${format(median)} [${format(ordered[0])}–${format(ordered.at(-1))}]`;
}
const rows = [];
for (const viewport of data.selection.viewports) {
  for (const size of data.selection.sizes) {
    for (const route of data.selection.routes) {
      for (const cache of ['cold', 'warm']) {
        const group = data.samples.filter(
          (s) =>
            s.viewport === viewport && s.size === size && s.route === route && s.cache === cache,
        );
        assert.equal(group.length, data.trials);
        assert.equal(new Set(group.map((s) => s.trial)).size, data.trials);
        const bytes = (sample, type) =>
          sum(sample.requests.filter((r) => !type || r.type === type).map((r) => r.transfer));
        rows.push([
          viewport,
          size,
          route,
          cache,
          summary(
            group.map((s) => bytes(s)),
            0,
          ),
          summary(
            group.map((s) => bytes(s, 'Font')),
            0,
          ),
          summary(
            group.map((s) => bytes(s, 'Image')),
            0,
          ),
          summary(group.map((s) => s.lcp)),
          summary(
            group.map((s) => s.cls),
            6,
          ),
          [...new Set(group.map((s) => s.lcpElement?.src ?? s.lcpElement?.tag))].join(', '),
        ]);
      }
    }
  }
}
console.log(
  `Commit: ${data.commit}; trials: ${data.trials}; photos: ${data.photos}; ${data.started}\n`,
);
console.log(
  [
    [
      'Viewport',
      'Набор',
      'Маршрут',
      'Кеш',
      'HTTP, Б',
      'Шрифт, Б',
      'Фото, Б',
      'LCP, мс',
      'CLS',
      'LCP element',
    ],
    Array(10).fill('---'),
    ...rows,
  ]
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n'),
);
