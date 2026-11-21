import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { routes } from './scenarios.mjs';

const sizes = { small: 'Малый', large: 'Большой' };
const caches = { cold: 'Холодный', warm: 'Тёплый' };
const scenarios = {
  filterCity: 'Город, 1 символ',
  filterPrice: 'Цена от, 1 цифра',
  likePending: 'Сохранение, ожидание',
  likeConfirmed: 'Сохранение, подтверждение',
  removePending: 'Удаление из избранного, ожидание',
  removeConfirmed: 'Удаление из избранного, подтверждение',
  chatInput: 'Сообщение, 5 символов',
  neighborMessage: 'Сообщение соседнего диалога',
  neighborPresence: 'Присутствие собеседника',
};

const count = new Intl.NumberFormat('ru-RU');
const duration = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const cls = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 6 });
const sum = (values) => values.reduce((total, value) => total + value, 0);

function sorted(values) {
  assert.ok(values.length && values.every(Number.isFinite), 'Expected numeric samples');
  return [...values].sort((a, b) => a - b);
}

function median(values) {
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function summary(values, format = count, showRange = false) {
  const ordered = sorted(values);
  const min = ordered[0];
  const max = ordered.at(-1);
  const center = format.format(median(ordered));
  return showRange || min !== max
    ? `${center} [${format.format(min)}–${format.format(max)}]`
    : center;
}

function table(header, rows) {
  console.log(
    [header, header.map(() => '---'), ...rows].map((row) => `| ${row.join(' | ')} |`).join('\n'),
  );
  console.log();
}

function network(sample) {
  const { requests, resources, wsReceived } = sample;
  const json = resources.filter(({ path }) => path.startsWith('/api/'));
  const transferred = requests.filter(({ transfer }) => transfer > 0);
  const transferredByType = (type) =>
    sum(transferred.filter((request) => request.type === type).map(({ transfer }) => transfer));
  return [
    requests.length,
    transferred.length,
    sum(transferred.map(({ transfer }) => transfer)),
    transferredByType('Script'),
    transferredByType('Stylesheet'),
    sum(json.map(({ encoded }) => encoded)),
    sum(json.map(({ decoded }) => decoded)),
    sum(wsReceived),
  ];
}

function reactMetrics(group) {
  const times = group.map(({ commits }) =>
    sum(commits.map(({ actualDuration }) => actualDuration)),
  );
  const hasCommitPhases = group.every(({ commitPhaseMs }) => Array.isArray(commitPhaseMs));
  return [
    summary(times, duration, true),
    hasCommitPhases
      ? summary(
          group.map(({ commitPhaseMs }) => sum(commitPhaseMs)),
          duration,
          true,
        )
      : '—',
    summary(group.map(({ commits }) => commits.length)),
  ];
}

function counters(group) {
  const names = [...new Set(group.flatMap(({ hits }) => Object.keys(hits)))].sort();
  return (
    names
      .map((name) => {
        const calls = summary(group.map(({ hits }) => hits[name]?.calls ?? 0));
        const items = group.map(({ hits }) => hits[name]?.items ?? 0);
        return `\`${name}\` ${calls}${items.some(Boolean) ? ` / ${summary(items)} эл.` : ''}`;
      })
      .join('<br>') || '—'
  );
}

function renderedCards(group) {
  const titles = [...new Set(group.flatMap(({ cards }) => Object.keys(cards)))];
  const byCount = new Map();
  for (const title of titles) {
    const renders = summary(group.map(({ cards }) => cards[title] ?? 0));
    const label =
      title.match(/^Тестовое объявление (\d+)$/)?.[1] ??
      title.replaceAll('|', '\\|').replaceAll('\n', ' ');
    const labels = byCount.get(renders) ?? [];
    labels.push(label);
    byCount.set(renders, labels);
  }
  return (
    [...byCount].map(([renders, labels]) => `${labels.join(', ')} (по ${renders})`).join('<br>') ||
    '—'
  );
}

const source = process.argv[2];
assert.ok(source, 'Из client/: node scripts/optimization-profile/report.mjs /tmp/o01.json');
const { trials, samples, selection } = JSON.parse(readFileSync(source, 'utf8'));
const selected = selection ?? {
  modes: ['production', 'profile'],
  sizes: Object.keys(sizes),
  routes,
};

function routeSamples(mode, size, route, cache) {
  const group = samples.filter(
    (sample) =>
      sample.mode === mode &&
      sample.size === size &&
      sample.route === route &&
      sample.cache === cache,
  );
  assert.equal(group.length, trials, `Неполная серия: ${mode} ${size} ${route} ${cache}`);
  assert.equal(new Set(group.map(({ trial }) => trial)).size, trials, 'Повторён номер прогона');
  return group;
}

function routeRows(mode) {
  return selected.sizes.flatMap((size) =>
    selected.routes.flatMap((route) =>
      Object.keys(caches).map((cache) => ({
        label: [sizes[size], `\`${route}\``, caches[cache]],
        group: routeSamples(mode, size, route, cache),
      })),
    ),
  );
}

const routeHeader = ['Набор', 'Маршрут', 'Кеш'];

console.log(
  `Число прогонов — ${trials}. Значения показаны как медиана [минимум–максимум]. Стабильные объёмы и счётчики показаны одним числом.\n`,
);

if (selected.modes.includes('production')) {
  const rows = routeRows('production');
  console.log('### Загрузка маршрутов · production\n');
  table(
    [...routeHeader, 'LCP, мс', 'CLS', 'Элементы DOM', 'JS heap, МиБ'],
    rows.map(({ label, group }) => [
      ...label,
      summary(
        group.map(({ lcp }) => lcp),
        duration,
        true,
      ),
      summary(
        group.map((sample) => sample.cls),
        cls,
        true,
      ),
      summary(group.map(({ domElements }) => domElements)),
      summary(
        group.map(({ heapUsed }) => heapUsed / 1024 ** 2),
        duration,
        true,
      ),
    ]),
  );

  console.log('### Сеть маршрутов · production\n');
  console.log(
    'HTTP, JS и CSS — байты CDP. Переданные ресурсы имеют положительный transfer. JSON — размеры тел HTTP-ответов по Resource Timing до и после распаковки. WS — байты входящих сообщений.\n',
  );
  table(
    [
      ...routeHeader,
      'HTTP ресурсов',
      'Из них передано',
      'HTTP всего, Б',
      'JS, Б',
      'CSS, Б',
      'JSON сжатый, Б',
      'JSON распакованный, Б',
      'WS, Б',
    ],
    rows.map(({ label, group }) => {
      const metrics = group.map(network);
      return [...label, ...metrics[0].map((_, index) => summary(metrics.map((row) => row[index])))];
    }),
  );
}

if (selected.modes.includes('profile')) {
  console.log('### Загрузка маршрутов · profiling\n');
  console.log(
    'На каждый прогон суммируются корневые React Profiler actualDuration (работа рендера) и, отдельно, измерения длительности фазы commit.\n',
  );
  const reactHeader = ['Σ actualDuration, мс', 'Σ фазы commit, мс', 'Коммиты'];
  table(
    [...routeHeader, ...reactHeader],
    routeRows('profile').map(({ label, group }) => [...label, ...reactMetrics(group)]),
  );

  console.log('### Взаимодействия · profiling, тёплый кеш\n');
  console.log(
    'Для ввода нескольких символов задержка до второго кадра сначала сводится к медиане внутри прогона. Счётчики показывают вызовы и, где измерено, суммарное число элементов при обходах. Карточки перечислены по номерам синтетических объявлений и числу рендеров каждой.\n',
  );
  const interactionRows = [];
  for (const size of selected.sizes) {
    for (const route of selected.routes) {
      const group = routeSamples('profile', size, route, 'warm');
      const keys = [
        ...new Set(group.flatMap(({ interactions }) => Object.keys(interactions ?? {}))),
      ];
      for (const key of keys) {
        const runs = group.map(({ interactions }) => interactions?.[key]);
        assert.ok(runs.every(Boolean), `Неполная серия сценария ${key}: ${size} ${route}`);
        interactionRows.push([
          sizes[size],
          scenarios[key] ?? key,
          ...reactMetrics(runs),
          summary(
            runs.map(({ eventToSecondFrameMs }) => median(sorted(eventToSecondFrameMs))),
            duration,
            true,
          ),
          counters(runs),
          renderedCards(runs),
        ]);
      }
    }
  }
  table(
    ['Набор', 'Сценарий', ...reactHeader, 'До второго кадра, мс', 'Счётчики', 'Карточки'],
    interactionRows,
  );
}
