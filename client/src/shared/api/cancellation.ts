import { CanceledError, isCancel } from 'axios';
import type { GenericAbortSignal } from 'axios';

export interface ReadOptions {
  signal?: AbortSignal;
}

export function isRequestCanceled(error: unknown): boolean {
  return (
    isCancel(error) ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error.name === 'AbortError' || error.name === 'CanceledError'))
  );
}

// Cancel only this consumer's wait; the shared refresh must continue for other requests.
export function waitForRefresh<T>(refresh: Promise<T>, signal?: GenericAbortSignal): Promise<T> {
  if (!signal) {
    return refresh;
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => {
      reject(new CanceledError('Request canceled while refreshing credentials'));
    };
    const cleanup = (): void => {
      signal.removeEventListener?.('abort', onAbort);
    };
    refresh.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener?.('abort', onAbort, { once: true });
    }
  });
}
