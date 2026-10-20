import { afterEach, expect, it, vi } from 'vitest';
import axiosInstance from '@shared/api/client';
import advertService from './advertService';

afterEach(() => {
  vi.restoreAllMocks();
});

it('requests default and explicit own-advert pages and parses pagination metadata', async () => {
  const get = vi
    .spyOn(axiosInstance, 'get')
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, limit: 12 } })
    .mockResolvedValueOnce({ data: { items: [], total: 5, page: 2, limit: 5 } });
  expect(await advertService.getMine()).toEqual({ items: [], total: 0, page: 1, limit: 12 });
  expect(get).toHaveBeenNthCalledWith(1, '/adverts/mine', { params: { page: 1, limit: 12 } });
  expect(await advertService.getMine(2, 5)).toEqual({ items: [], total: 5, page: 2, limit: 5 });
  expect(get).toHaveBeenNthCalledWith(2, '/adverts/mine', { params: { page: 2, limit: 5 } });
});

it.each([
  { data: [] },
  { data: { items: [], total: -1, page: 1, limit: 12 } },
  { data: { items: [], total: 0, page: 0, limit: 12 } },
  { data: { items: [], total: 0, page: 1, limit: 51 } },
])('rejects malformed pagination response %#', async ({ data }) => {
  vi.spyOn(axiosInstance, 'get').mockResolvedValueOnce({ data });
  await expect(advertService.getMine()).rejects.toThrow();
});
