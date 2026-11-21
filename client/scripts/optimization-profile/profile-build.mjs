import { build } from 'vite';

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
  'ChatPage.tsx': [
    [body, body + probe('ChatPage')],
    [
      'activeConversation?.messages.map((message) => message.id)',
      "activeConversation && (window.__measure.hit('historySeenInit', activeConversation.messages.length), activeConversation.messages.map((message) => message.id))",
    ],
    [
      '{activeConversation.messages.map(',
      "{(window.__measure.hit('historyMarkup', activeConversation.messages.length), activeConversation.messages).map(",
    ],
    [
      'messages.filter((message)',
      "(window.__measure.hit('historyIncoming', messages.length), messages).filter((message)",
    ],
    [
      'new Set(messages.map(',
      "new Set((window.__measure.hit('historySeenEffect', messages.length), messages).map(",
    ],
  ],
  'pages/chat/ui/messages-route/helper.ts': [
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

export async function buildClient(outDir, profile) {
  await build({
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
    build: { outDir, emptyOutDir: false },
  });
}
