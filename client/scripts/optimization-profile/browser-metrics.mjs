// Installed by CDP before any app code runs, in each fresh document.
export function observePage(profile) {
  performance.setResourceTimingBufferSize(4000);
  let lcp = null;
  const shifts = [];
  const longTasks = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      lcp = entry.startTime;
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        shifts.push([entry.startTime, entry.value]);
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((list) => {
    for (const { startTime, duration } of list.getEntries()) {
      longTasks.push({ startTime, duration });
    }
  }).observe({ type: 'longtask', buffered: true });
  let commits = [];
  let commitPhaseMs = [];
  let hits = {};
  let cards = {};
  let timing = [];
  let expectEvent = '';
  function startTiming(kind) {
    if (kind !== expectEvent) {
      return;
    }
    const start = performance.now();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        timing.push(performance.now() - start);
      }),
    );
  }
  if (profile) {
    // React 18 exposes commit boundaries via its optional DevTools profiling API.
    // Keep the full root phases distinct from Profiler.actualDuration (render work).
    const commitStarts = [];
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject(renderer) {
        renderer.injectProfilingHooks({
          markCommitStarted() {
            commitStarts.push(performance.now());
          },
          markCommitStopped() {
            commitPhaseMs.push(performance.now() - commitStarts.pop());
          },
        });
        return 1;
      },
    };
    for (const kind of ['input', 'click']) {
      window.addEventListener(kind, () => startTiming(kind), true);
    }
    // Install early listeners for the delivery instant, before app handlers.
    const NativeSocket = window.WebSocket;
    window.WebSocket = class extends NativeSocket {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', () => startTiming('message'));
      }
    };
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function instrumentOpen(...args) {
      const method = args[0].toUpperCase();
      if ((method === 'POST' || method === 'DELETE') && String(args[1]).includes('/likes/')) {
        this.addEventListener('readystatechange', () => {
          if (this.readyState === 4) {
            startTiming('response');
          }
        });
      }
      return open.apply(this, args);
    };
  }
  window.__measure = {
    commit(_id, phase, actualDuration, baseDuration, startTime, commitTime) {
      commits.push({ phase, actualDuration, baseDuration, startTime, commitTime });
    },
    hit(name, items = 0) {
      const hit = (hits[name] ??= { calls: 0, items: 0 });
      hit.calls++;
      hit.items += items;
    },
    card(title) {
      cards[title] = (cards[title] ?? 0) + 1;
    },
    start(event) {
      commits = [];
      commitPhaseMs = [];
      hits = {};
      cards = {};
      timing = [];
      expectEvent = event;
    },
    metrics() {
      return { commits, commitPhaseMs, hits, cards, eventToSecondFrameMs: timing };
    },
    route() {
      let cls = 0,
        sum = 0,
        first = -Infinity,
        last = -Infinity;
      for (const [time, value] of shifts) {
        if (time - last >= 1000 || time - first >= 5000) {
          sum = 0;
          first = time;
        }
        sum += value;
        cls = Math.max(cls, sum);
        last = time;
      }
      const resources = ['navigation', 'resource'].flatMap((kind) =>
        performance.getEntriesByType(kind).map((e) => ({
          path: new URL(e.name).pathname + new URL(e.name).search,
          initiator: e.initiatorType,
          transfer: e.transferSize,
          encoded: e.encodedBodySize,
          decoded: e.decodedBodySize,
          endMs: e.responseEnd,
        })),
      );
      return {
        resources,
        lcp,
        cls,
        domElements: document.getElementsByTagName('*').length,
        historyParagraphs: document.querySelectorAll('[aria-label="Сообщения"] p').length,
        longTasks,
        commits,
        commitPhaseMs,
        hits,
      };
    },
  };
}
