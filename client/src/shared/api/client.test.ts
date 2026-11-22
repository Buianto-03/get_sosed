import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosInstance, { configureApiAuth } from './client';

describe('HTTP client authentication', () => {
  it('preserves the session when a replayed request has a validation error', async () => {
    const unauthorized = vi.fn();
    const originalAdapter = axiosInstance.defaults.adapter;
    configureApiAuth({
      getAccessToken: () => 'expired',
      refreshAccessToken: async () => 'fresh',
      onUnauthorized: unauthorized,
    });
    axiosInstance.defaults.adapter = async (config) => {
      const status = config.headers.Authorization === 'Bearer fresh' ? 400 : 403;
      const response = {
        data: { code: 'INVALID_ADVERT_DATA' },
        status,
        statusText: 'Rejected',
        headers: {},
        config,
      };
      throw new AxiosError('Rejected', 'ERR_BAD_REQUEST', config, undefined, response);
    };
    try {
      await expect(axiosInstance.post('/adverts', new FormData())).rejects.toMatchObject({
        response: { status: 400 },
      });
      expect(unauthorized).not.toHaveBeenCalled();
    } finally {
      axiosInstance.defaults.adapter = originalAdapter;
    }
  });

  it('clears the session when refreshing credentials itself fails', async () => {
    const unauthorized = vi.fn();
    const originalAdapter = axiosInstance.defaults.adapter;
    configureApiAuth({
      getAccessToken: () => 'expired',
      refreshAccessToken: async () => {
        throw new Error('Refresh rejected');
      },
      onUnauthorized: unauthorized,
    });
    axiosInstance.defaults.adapter = async (config) => {
      throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, {
        data: {},
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      });
    };
    try {
      await expect(axiosInstance.get('/protected')).rejects.toThrow('Refresh rejected');
      expect(unauthorized).toHaveBeenCalledOnce();
    } finally {
      axiosInstance.defaults.adapter = originalAdapter;
    }
  });

  afterEach(() => {
    configureApiAuth({
      getAccessToken: () => '',
      refreshAccessToken: async () => '',
      onUnauthorized: () => undefined,
    });
  });

  it('retries concurrent 403 responses after one token refresh', async () => {
    let attempts = 0;
    let refreshes = 0;
    let token = 'expired';
    const originalAdapter = axiosInstance.defaults.adapter;
    configureApiAuth({
      getAccessToken: () => token,
      refreshAccessToken: async () => {
        refreshes += 1;
        await new Promise((resolve) => {
          setTimeout(resolve, 1);
        });
        token = 'fresh';
        return token;
      },
      onUnauthorized: () => {
        throw new Error('unexpected authorization failure');
      },
    });
    axiosInstance.defaults.adapter = async (config) => {
      attempts += 1;
      if (config.headers.Authorization !== 'Bearer fresh') {
        const response = { data: {}, status: 403, statusText: 'Forbidden', headers: {}, config };
        throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, response);
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };

    try {
      const responses = await Promise.all([
        axiosInstance.get<{ ok: boolean }>('/protected'),
        axiosInstance.get<{ ok: boolean }>('/protected'),
      ]);
      expect(responses.every((response) => response.data.ok === true)).toBe(true);
      expect(attempts).toBe(4);
      expect(refreshes).toBe(1);
    } finally {
      axiosInstance.defaults.adapter = originalAdapter;
    }
  });
});

it('cancels one refresh waiter immediately without canceling the shared refresh or replaying it', async () => {
  let complete!: (token: string) => void;
  const refresh = vi.fn(
    () =>
      new Promise<string>((resolve) => {
        complete = resolve;
      }),
  );
  const unauthorized = vi.fn();
  const originalAdapter = axiosInstance.defaults.adapter;
  const attempts: string[] = [];
  const controller = new AbortController();
  configureApiAuth({
    getAccessToken: () => 'expired',
    refreshAccessToken: refresh,
    onUnauthorized: unauthorized,
  });
  axiosInstance.defaults.adapter = async (config) => {
    attempts.push(`${config.url}:${String(config.headers.Authorization)}`);
    if (config.headers.Authorization !== 'Bearer fresh') {
      throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, {
        data: {},
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      });
    }
    return { data: 'ok', status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    const canceled = axiosInstance.get('/canceled', { signal: controller.signal });
    const canceledResult = expect(canceled).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    const current = axiosInstance.get<string>('/current');
    await vi.waitFor(() => expect(attempts).toHaveLength(2));
    expect(refresh).toHaveBeenCalledOnce();
    controller.abort();
    await canceledResult;
    expect(attempts).toHaveLength(2);
    expect(unauthorized).not.toHaveBeenCalled();
    complete('fresh');
    expect((await current).data).toBe('ok');
    expect(attempts).toEqual([
      '/canceled:Bearer expired',
      '/current:Bearer expired',
      '/current:Bearer fresh',
    ]);
    expect(unauthorized).not.toHaveBeenCalled();
  } finally {
    axiosInstance.defaults.adapter = originalAdapter;
    configureApiAuth({
      getAccessToken: () => '',
      refreshAccessToken: async () => '',
      onUnauthorized: () => undefined,
    });
  }
});

it('rejects an already canceled request without refresh or session invalidation', async () => {
  const originalAdapter = axiosInstance.defaults.adapter;
  const adapter = vi.fn();
  const refresh = vi.fn(async () => 'fresh');
  const unauthorized = vi.fn();
  const controller = new AbortController();
  controller.abort();
  configureApiAuth({
    getAccessToken: () => 'expired',
    refreshAccessToken: refresh,
    onUnauthorized: unauthorized,
  });
  axiosInstance.defaults.adapter = adapter;
  try {
    await expect(
      axiosInstance.get('/canceled', { signal: controller.signal }),
    ).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    expect(adapter).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(unauthorized).not.toHaveBeenCalled();
  } finally {
    axiosInstance.defaults.adapter = originalAdapter;
    configureApiAuth({
      getAccessToken: () => '',
      refreshAccessToken: async () => '',
      onUnauthorized: () => undefined,
    });
  }
});

it('invalidates credentials once on a real shared refresh failure after one waiter cancels', async () => {
  let fail!: (error: Error) => void;
  const refresh = vi.fn(
    () =>
      new Promise<string>((_, reject) => {
        fail = reject;
      }),
  );
  const unauthorized = vi.fn();
  const originalAdapter = axiosInstance.defaults.adapter;
  const controller = new AbortController();
  configureApiAuth({
    getAccessToken: () => 'expired',
    refreshAccessToken: refresh,
    onUnauthorized: unauthorized,
  });
  axiosInstance.defaults.adapter = async (config) => {
    throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, {
      data: {},
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config,
    });
  };
  try {
    const canceled = expect(
      axiosInstance.get('/canceled', { signal: controller.signal }),
    ).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    const first = expect(axiosInstance.get('/first')).rejects.toThrow('Refresh failed');
    const second = expect(axiosInstance.get('/second')).rejects.toThrow('Refresh failed');
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    controller.abort();
    await canceled;
    expect(unauthorized).not.toHaveBeenCalled();
    fail(new Error('Refresh failed'));
    await Promise.all([first, second]);
    expect(unauthorized).toHaveBeenCalledOnce();
  } finally {
    axiosInstance.defaults.adapter = originalAdapter;
    configureApiAuth({
      getAccessToken: () => '',
      refreshAccessToken: async () => '',
      onUnauthorized: () => undefined,
    });
  }
});
