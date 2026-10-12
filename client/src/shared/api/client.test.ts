import { AxiosError } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import axiosInstance, { configureApiAuth } from './client';

describe('HTTP client authentication', () => {
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
        await new Promise((resolve) => { setTimeout(resolve, 1); });
        token = 'fresh';
        return token;
      },
      onUnauthorized: () => { throw new Error('unexpected authorization failure'); },
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
