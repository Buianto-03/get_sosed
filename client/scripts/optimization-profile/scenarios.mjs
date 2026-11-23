import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

export const routes = ['/', '/listings', '/profile', '/messages/2'];
const text = (selector) => `document.querySelector(${JSON.stringify(selector)})`;
const number = (selector) => `document.querySelectorAll(${JSON.stringify(selector)}).length`;
const city = text('input[placeholder="Любой город"]');
const priceFrom = text('input[id$="-desktop-price-from"]');
const composer = text('input[placeholder="Напишите сообщение"]');
const messageRegion = text('[role=region][aria-label="Сообщения"]');
const messageRows = '[role=region][aria-label="Сообщения"] [data-message-id]';
const olderButton = `Array.from(document.querySelectorAll('button')).find(
  (button) => button.textContent.includes('Загрузить предыдущие сообщения'))`;
const save = 'window.__saveTarget';
const favorites = 'section[aria-labelledby=favorites] article';
const firstFavorite = text(`${favorites} button[aria-pressed]`);

export async function measureRoute(page, server, route, size, profile) {
  const large = size === 'large';
  const ready = {
    '/': `${number('article button[aria-pressed]:enabled')} === 3`,
    '/listings': `${number('article button[aria-pressed]:enabled')} === 8 && ${number('input[type=checkbox]:enabled')} === ${large ? 200 : 20}`,
    '/profile': `${number(favorites)} === ${large ? 500 : 50} && ${number('section[aria-labelledby=my-listings] article')} > 0`,
    '/messages/2': `${number('section[aria-label="Диалоги"] button')} === 50 && ${number('[role=region][aria-label="Сообщения"] p')} === 50`,
  };
  await page.send('Page.navigate', { url: 'about:blank' });
  await page.wait("location.href === 'about:blank' && document.readyState === 'complete'");
  page.resetNetwork();
  await page.send('Page.navigate', { url: server.origin + route });
  await page.wait(`location.pathname === ${JSON.stringify(route)} && (${ready[route]})`);
  await page.evaluate('document.fonts.ready.then(() => true)');
  // Allow final paint, resource events and passive effects to reach the observer.
  // This fixed observation tail is never included in the last-resource/commit metrics.
  await delay(650);
  const metrics = await page.evaluate('__measure.route()');
  const heap = await page.send('Runtime.getHeapUsage');
  const network = page.network();
  assert.equal(server.failures.length, 0, server.failures.join('\n'));
  assert.equal(page.diagnostics.length, 0, page.diagnostics.join('\n'));
  assert.ok(metrics.lcp > 0, 'missing LCP');
  assert.ok(
    !profile || metrics.commits.some((c) => c.actualDuration > 0),
    'profiling build produced no measured renders',
  );
  assert.ok(
    !profile || metrics.commitPhaseMs.some((ms) => ms > 0),
    'missing React commit-phase hook',
  );
  for (const r of network.requests) {
    assert.ok(Number.isFinite(r.transfer) && r.status < 400, JSON.stringify(r));
  }
  return { ...metrics, ...network, heapUsed: heap.usedSize };
}

async function begin(page, event) {
  await page.evaluate(`__measure.start(${JSON.stringify(event)})`);
}
async function finish(page, count = 1, needsCommit = true) {
  await page.wait(`__measure.metrics().eventToSecondFrameMs.length === ${count}`);
  const metrics = await page.evaluate('__measure.metrics()');
  if (needsCommit) {
    assert.ok(
      metrics.commits.length > 0 && metrics.commitPhaseMs.length > 0,
      'missing React interaction timing',
    );
  }
  return metrics;
}
async function type(page, input, chars) {
  await page.evaluate(`${input}.focus()`);
  await begin(page, 'input');
  let typed = '';
  for (const char of chars) {
    typed += char;
    await page.send('Input.insertText', { text: char });
    await page.wait(
      `${input}.value === ${JSON.stringify(typed)} && __measure.metrics().eventToSecondFrameMs.length === ${typed.length}`,
    );
  }
  return finish(page, chars.length);
}

export async function checkHistoryPagination(page, server, size) {
  await page.evaluate(`${messageRegion}.scrollTop = 0`);
  const anchor = await page.evaluate(`new Promise((resolve) => requestAnimationFrame(() => {
    const region = ${messageRegion};
    const top = region.getBoundingClientRect().top;
    const row = Array.from(region.querySelectorAll('[data-message-id]')).find(
      (entry) => entry.getBoundingClientRect().bottom > top);
    resolve({ id: row.dataset.messageId, offset: row.getBoundingClientRect().top - top });
  }))`);
  await page.evaluate(`(() => {
    const button = ${olderButton};
    button.focus({ preventScroll: true });
    button.click();
  })()`);
  await page.wait(`${number(messageRows)} === 100`);
  const restoredOffset = await page.evaluate(`new Promise((resolve) => requestAnimationFrame(() => {
    const region = ${messageRegion};
    const row = region.querySelector('[data-message-id="${anchor.id}"]');
    resolve(row.getBoundingClientRect().top - region.getBoundingClientRect().top);
  }))`);
  assert.ok(Math.abs(anchor.offset - restoredOffset) < 2, 'loading older history moved the anchor');
  const focused = size === 'small' ? messageRegion : `(${olderButton})`;
  assert.equal(await page.evaluate(`document.activeElement === ${focused}`), true);

  // More than one page fits in the reconnect gap.
  server.disconnectWithQueuedMessages(55);
  await page.wait(
    `${number(messageRows)} === 155 && ${messageRegion}.textContent.includes('Сообщение вне сети 55')`,
  );
  const ids =
    await page.evaluate(`Array.from(document.querySelectorAll(${JSON.stringify(messageRows)}),
    (row) => Number(row.dataset.messageId))`);
  assert.ok(
    ids.every((id, index) => index === 0 || id > ids[index - 1]),
    'history IDs must ascend without duplicates',
  );
  return { olderPageRows: 50, recoveredRows: 55, anchorShiftPx: restoredOffset - anchor.offset };
}

export async function interact(page, server, route) {
  if (route === '/listings') {
    await page.evaluate(
      "void (window.__saveTarget = document.querySelector('article button[aria-pressed=false]'))",
    );
    const filterCity = await type(page, city, 'М');
    const filterPrice = await type(page, priceFrom, '3');
    assert.equal(await page.evaluate(`${save}.getAttribute('aria-pressed')`), 'false');
    // Keep the incoming HTTP confirmation out of the pending observation window.
    server.holdLike();
    let likePending, likeConfirmed;
    try {
      await begin(page, 'click');
      await page.evaluate(`${save}.click()`);
      await page.wait(`${save}.disabled`);
      likePending = await finish(page);
      await begin(page, 'response');
      server.releaseLike();
      await page.wait(`!${save}.disabled && ${save}.getAttribute('aria-pressed') === 'true'`);
      likeConfirmed = await finish(page);
    } finally {
      server.releaseLike();
    }
    return { filterCity, filterPrice, likePending, likeConfirmed };
  }
  if (route === '/profile') {
    const favoriteCount = await page.evaluate(number(favorites));
    assert.equal(
      await page.evaluate(`${firstFavorite}.closest('article').querySelector('h3').textContent`),
      'Тестовое объявление 2',
    );
    assert.equal(await page.evaluate(`${firstFavorite}.getAttribute('aria-pressed')`), 'true');
    server.holdLike();
    try {
      await begin(page, 'click');
      await page.evaluate(`${firstFavorite}.click()`);
      await page.wait(
        `${firstFavorite}.disabled && ${firstFavorite}.getAttribute('aria-pressed') === 'true' && ${number(favorites)} === ${favoriteCount}`,
      );
      const removePending = await finish(page);
      await begin(page, 'response');
      server.releaseLike();
      await page.wait(`${number(favorites)} === ${favoriteCount - 1}`);
      const removeConfirmed = await finish(page);
      return { removePending, removeConfirmed };
    } finally {
      server.releaseLike();
    }
  }
  if (route === '/messages/2') {
    const chatInput = await type(page, composer, 'абвгд');
    await begin(page, 'message');
    server.neighbor();
    await page.wait(
      "document.querySelector('section[aria-label=Диалоги]').textContent.includes('Новое сообщение соседнего диалога')",
    );
    const neighborMessage = await finish(page);
    await begin(page, 'message');
    server.presence();
    const neighborPresence = await finish(page, 1, false);
    return { chatInput, neighborMessage, neighborPresence };
  }
  return {};
}
