import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

export async function openChrome(directory, binary) {
  const child = spawn(
    binary,
    [
      '--headless=new',
      '--remote-debugging-pipe',
      '--no-first-run',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-extensions',
      '--no-default-browser-check',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--metrics-recording-only',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
      `--user-data-dir=${directory}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] },
  );
  let sequence = 0;
  const pending = new Map();
  const listeners = new Set();
  let buffer = '';
  let stderr = '';
  child.stderr.on('data', (data) => {
    stderr = (stderr + data).slice(-2000);
  });
  child.stdio[4].setEncoding('utf8');
  child.stdio[4].on('data', (data) => {
    buffer += data;
    for (let end = buffer.indexOf('\0'); end >= 0; end = buffer.indexOf('\0')) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      const call = pending.get(message.id);
      if (call) {
        pending.delete(message.id);
        if (message.error) {
          call.reject(new Error(JSON.stringify(message.error)));
        } else {
          call.resolve(message.result);
        }
      } else if (message.method) {
        for (const listener of listeners) {
          listener(message);
        }
      }
    }
  });
  const rejectAll = (error) => {
    for (const call of pending.values()) {
      call.reject(error);
    }
    pending.clear();
  };
  child.on('error', rejectAll);
  child.on('exit', (code, signal) =>
    rejectAll(new Error(`Chrome exited ${code}/${signal} ${stderr}`)),
  );
  function command(method, params = {}, sessionId) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error('CDP timeout: ' + method));
      }, 60000);
      pending.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      child.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
  }
  try {
    const version = await command('Browser.getVersion');
    return {
      version,
      async newPage() {
        const { browserContextId } = await command('Target.createBrowserContext');
        const { targetId } = await command('Target.createTarget', {
          url: 'about:blank',
          browserContextId,
        });
        const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
        const send = (method, params) => command(method, params, sessionId);
        async function evaluate(expression) {
          const { result, exceptionDetails } = await send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true,
          });
          if (exceptionDetails) {
            throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
          }
          return result.value;
        }
        const diagnostics = [];
        const requests = new Map();
        let wsReceived = [];
        const current = (id) => requests.get(id);
        const listen = ({ sessionId: from, method, params }) => {
          if (from !== sessionId) {
            return;
          }
          if (method === 'Network.requestWillBeSent' && /^https?:/.test(params.request.url)) {
            const url = new URL(params.request.url);
            requests.set(params.requestId, {
              path: url.pathname + url.search,
              type: params.type,
              method: params.request.method,
            });
          } else if (method === 'Network.responseReceived' && current(params.requestId)) {
            Object.assign(current(params.requestId), {
              status: params.response.status,
              diskCache: params.response.fromDiskCache,
              contentEncoding: params.response.headers['Content-Encoding'] ?? null,
            });
          } else if (method === 'Network.requestServedFromCache' && current(params.requestId)) {
            current(params.requestId).cache = true;
          } else if (method === 'Network.loadingFinished' && current(params.requestId)) {
            current(params.requestId).transfer = params.encodedDataLength;
          } else if (method === 'Network.webSocketFrameReceived') {
            wsReceived.push(Buffer.byteLength(params.response.payloadData));
          } else if (method === 'Runtime.exceptionThrown') {
            diagnostics.push(
              params.exceptionDetails.exception?.description ?? params.exceptionDetails.text,
            );
          } else if (method === 'Network.loadingFailed' && !params.canceled) {
            diagnostics.push(params.errorText);
          }
        };
        listeners.add(listen);
        await Promise.all([
          send('Page.enable'),
          send('Runtime.enable'),
          send('Network.enable'),
          send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false,
          }),
        ]);
        return {
          send,
          evaluate,
          diagnostics,
          resetNetwork() {
            requests.clear();
            wsReceived = [];
          },
          network() {
            return { requests: [...requests.values()], wsReceived };
          },
          async wait(expression) {
            const start = Date.now();
            while (Date.now() - start < 30000) {
              if (await evaluate(expression)) {
                return;
              }
              await delay(25);
            }
            const state = await evaluate('document.body.innerText.slice(0, 500)');
            throw new Error(`Timed out on ${expression}\n${state}\n${diagnostics.join('\n')}`);
          },
          async close() {
            listeners.delete(listen);
            await command('Target.disposeBrowserContext', { browserContextId });
          },
        };
      },
      async close() {
        const exited = once(child, 'exit');
        await command('Browser.close');
        await exited;
      },
    };
  } catch (error) {
    child.kill();
    throw error;
  }
}
