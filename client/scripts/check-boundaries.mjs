import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

const root = resolve('src');
const levels = { app: 0, pages: 1, widgets: 2, features: 3, entities: 4, shared: 5 };
const sourceFiles = [];

async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) sourceFiles.push(path);
  }
}

await collect(root);
const errors = [];
for (const file of sourceFiles) {
  const source = relative(root, file).split(sep);
  const content = await readFile(file, 'utf8');
  const imports = content.matchAll(/\b(?:from|import)\s*['"]([^'"]+)['"]/g);
  for (const [, specifier] of imports) {
    let target;
    if (specifier.startsWith('.')) {
      target = resolve(dirname(file), specifier);
    } else {
      const aliasMatch = specifier.match(/^@(app|pages|widgets|features|entities|shared)\/(.*)$/);
      if (!aliasMatch) continue;
      target = resolve(root, aliasMatch[1], aliasMatch[2]);
    }
    const destination = relative(root, target).split(sep);
    if (!(source[0] in levels) || !(destination[0] in levels)) continue;
    const storeHooks = destination.join('/') === 'app/store/hooks';
    if (levels[destination[0]] < levels[source[0]] && !storeHooks) {
      errors.push(`${source.join('/')} imports upward from ${destination.join('/')}`);
    }
    if (['entities', 'features', 'widgets'].includes(source[0])
      && source[0] === destination[0] && source[1] !== destination[1]) {
      errors.push(`${source.join('/')} imports another ${source[0]} slice: ${destination.join('/')}`);
    }
    if (source[0] === 'shared' && destination[0] !== 'shared') {
      errors.push(`${source.join('/')} imports business or app code: ${destination.join('/')}`);
    }
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('FSD boundaries: OK\n');
}
