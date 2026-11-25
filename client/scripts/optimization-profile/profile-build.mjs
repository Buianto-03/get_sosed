import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import { mkdtemp, realpath, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Transform only the disposable profiling build. Match known call sites exactly so a
// changed implementation cannot silently register a bogus zero in the baseline.
const count = (name, items = '0') => `window.__measure.hit('${name}', ${items})`;
const probe = (name) => `\n  ${count(name)};\n`;
const body = '): JSX.Element {';
const probes = {
  'main.tsx': [
    [
      '<App />',
      '<React.Profiler id="app" onRender={window.__measure.commit}><App /></React.Profiler>',
    ],
  ],
  'ConversationRow.tsx': [[body, body + probe('ConversationRow')]],
  'Checkbox.tsx': [[body, body + probe('Checkbox')]],
  'ListingCard.tsx': [
    [body, body + probe('ListingCard') + '  window.__measure.card(listing.title);\n'],
  ],
  'FilterForm.tsx': [[body, body + probe('FilterForm')]],
  'FilterConditions.tsx': [[body, body + probe('FilterConditions')]],
  'MessageComposer.tsx': [[body, body + probe('MessageComposer')]],
  'ChatPage.tsx': [[body, body + probe('ChatPage')]],
  'ChatThread.tsx': [
    [body, body + probe('ChatThread')],
    ['{messages.map(', "{(window.__measure.hit('historyMarkup', messages.length), messages).map("],
    [
      'const incoming = messages.filter(',
      "const incoming = (window.__measure.hit('historyIncoming', messages.length), messages).filter(",
    ],
    [
      'new Set(messages.map(',
      "new Set((window.__measure.hit('historySeenEffect', messages.length), messages).map(",
    ],
  ],
  'pages/chat/ui/messages-route/helper.ts': [
    [
      '(row, userId): ChatConversationRow => {',
      `(row, userId): ChatConversationRow => {${probe('rowProjection')}`,
    ],
    [
      'return messages.map(',
      "window.__measure.hit('historyProjection', messages.length); return messages.map(",
    ],
  ],
  'tag-catalog.ts': [
    [
      'function buildTagCatalogView(tags: readonly TagType[]): TagCatalogView {',
      "function buildTagCatalogView(tags: readonly TagType[]): TagCatalogView { window.__measure.hit('buildTagCatalogView', tags.length);",
    ],
  ],
};

function profilingPlugin() {
  const matched = new Set();
  return {
    name: 'o01-profile',
    enforce: 'pre',
    transform(code, id) {
      const key = Object.keys(probes).find((suffix) => id.endsWith('/' + suffix));
      if (!key || !id.includes('/src/')) {
        return;
      }
      let source = code;
      for (const [before, after] of probes[key]) {
        if (source.split(before).length !== 2) {
          throw new Error(`Update O01 probe in ${key}: ${before}`);
        }
        source = source.replace(before, after);
      }
      matched.add(key);
      return { code: source, map: null };
    },
    buildEnd(error) {
      if (!error && matched.size !== Object.keys(probes).length) {
        throw new Error(
          'Missing O01 profiling module: ' +
            Object.keys(probes)
              .filter((key) => !matched.has(key))
              .join(', '),
        );
      }
    },
  };
}

export async function buildClient(outDir, profile, revision) {
  const archiveDir = revision ? await mkdtemp(join(tmpdir(), 'get-sosed-baseline-')) : undefined;
  try {
    if (archiveDir) {
      const clientRoot = fileURLToPath(new URL('../../', import.meta.url));
      const archive = execFileSync('git', ['archive', `${revision}:client`], {
        cwd: resolve(clientRoot, '..'),
        maxBuffer: 64 * 1024 * 1024,
      });
      execFileSync('tar', ['-xf', '-', '-C', archiveDir], { input: archive });
      await symlink(join(clientRoot, 'node_modules'), join(archiveDir, 'node_modules'), 'dir');
    }
    await build({
      root: archiveDir ? await realpath(archiveDir) : undefined,
      logLevel: 'error',
      // The benchmark must never use the developer's configured API or WebSocket.
      define: {
        'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
        'import.meta.env.VITE_WS_URL': JSON.stringify(''),
        'import.meta.env.VITE_YANDEX_API_KEY': 'undefined',
      },
      resolve: {
        alias: profile
          ? [{ find: /^react-dom(?:\/client)?$/, replacement: 'react-dom/profiling' }]
          : [],
      },
      plugins: profile ? [profilingPlugin()] : [],
      build: { outDir: resolve(outDir), emptyOutDir: false },
    });
  } finally {
    if (archiveDir) {
      await rm(archiveDir, { recursive: true, force: true });
    }
  }
}

export function usesLegacyListingWire(revision) {
  if (!revision) {
    return false;
  }

  const modelPaths = execFileSync(
    'git',
    ['ls-tree', '-r', '--full-tree', '--name-only', revision, '--', 'server/db/models'],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean);
  return modelPaths.some((path) => /\/advert\.(?:js|ts)$/.test(path));
}
