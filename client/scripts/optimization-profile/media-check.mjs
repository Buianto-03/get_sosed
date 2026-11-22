// Check format fallback and responsive sizing in a built production client.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { openChrome } from './chrome.mjs';
import { serve } from './local-server.mjs';

assert.ok(process.argv[2], 'node scripts/optimization-profile/media-check.mjs DIST');
const temporary = await mkdtemp(join(tmpdir(), 'get-sosed-o02-check-'));
const server = await serve(resolve(process.argv[2]), { photos: true });
let browser;
try {
  browser = await openChrome(
    temporary,
    process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  );
  for (const [format, disabled] of [
    ['avif', []],
    ['webp', ['avif']],
    ['jpg', ['avif', 'webp']],
  ]) {
    for (const [width, dpr] of [
      [320, 1],
      [390, 2],
      [768, 2],
      [808, 1],
      [809, 1],
      [1100, 1],
      [1440, 1],
      [1920, 1],
    ]) {
      for (const route of ['/', '/about']) {
        server.reset('small');
        const page = await browser.newPage();
        try {
          await page.send('Emulation.setDeviceMetricsOverride', {
            width,
            height: 900,
            deviceScaleFactor: dpr,
            mobile: width <= 390,
          });
          await page.send('Emulation.setDisabledImageTypes', { imageTypes: disabled });
          await page.send('Page.navigate', { url: server.origin + route });
          await page.wait("document.querySelector('picture img')?.naturalWidth > 0");
          await page.evaluate('document.fonts.ready.then(() => true)');
          const image = await page.evaluate(`(() => {
            const img = document.querySelector('picture img');
            const bounds = img.getBoundingClientRect();
            return { src: new URL(img.currentSrc).pathname, priority: img.fetchPriority,
              loading: img.loading, alt: img.alt, width: bounds.width, height: bounds.height,
              overflow: document.documentElement.scrollWidth > innerWidth };
          })()`);
          assert.ok(image.src.endsWith('.' + format), JSON.stringify(image));
          if (format !== 'jpg') {
            const candidate = [480, 768, 1280].find((pixels) => pixels >= image.width * dpr) ?? 1280;
            assert.equal(image.src, `/redesign-hero-${candidate}.${format}`);
          }
          assert.equal(image.loading, 'eager');
          assert.equal(image.priority, 'high');
          assert.ok(image.alt && image.width > 0 && image.height > 0);
          assert.equal(image.overflow, false, `${width} ${route}`);
          assert.ok(!page.network().requests.some((r) => r.path.endsWith('.ttf')));
          assert.equal(page.diagnostics.length, 0, page.diagnostics.join('\n'));
          assert.equal(server.failures.length, 0, server.failures.join('\n'));
          console.log(
            `${route} ${width}@${dpr}: ${image.src}; ${image.width.toFixed(1)} × ${image.height.toFixed(1)}`,
          );
        } finally {
          await page.close();
        }
      }
    }
  }
} finally {
  await browser?.close();
  await server.close();
  await rm(temporary, { recursive: true, force: true });
}
