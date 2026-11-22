// Uses the repository's existing sharp installation, without adding a client dependency.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../server/package.json', import.meta.url));
const sharp = require('sharp');
const source = new URL('../../public/redesign-hero.jpg', import.meta.url);
for (const width of [480, 768, 1280]) {
  for (const format of ['avif', 'webp']) {
    // The existing JPEG has no end marker. Decode it as browsers do, preserving its pixels.
    const image = sharp(source.pathname, { failOn: 'none' }).resize({ width });
    const encoded =
      format === 'avif'
        ? image.avif({ quality: 55, effort: 6 })
        : image.webp({ quality: 80, effort: 6 });
    const destination = new URL(`../../public/redesign-hero-${width}.${format}`, import.meta.url);
    const info = await encoded.toFile(destination.pathname);
    console.log(destination.pathname, info.size);
  }
}
