import { CanceledError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import axiosInstance from '@shared/api/client';
import type { ReadOptions } from '@shared/api/cancellation';
import advertService from '@entities/advert/api/advertService';
import chatService from '@entities/chat/api/chatListService';
import likeService from '@entities/like/api/likeService';

const originalAdapter = axiosInstance.defaults.adapter;
afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

it.each([
  ['adverts', (options: ReadOptions) => advertService.getAdverts(options)],
  [
    'search',
    (options: ReadOptions) =>
      advertService.getFilteredAdverts(
        {
          city: '',
          district: '',
          metro: '',
          priceFrom: 0,
          priceTo: 0,
          roomsFrom: 0,
          roomsTo: 0,
          tags: [],
        },
        options,
      ),
  ],
  ['detail', (options: ReadOptions) => advertService.getAdvertById(7, options)],
  ['tags', (options: ReadOptions) => advertService.getTagsBySearch('', options)],
  ['own adverts', (options: ReadOptions) => advertService.getMine(1, 12, options)],
  ['saved adverts', (options: ReadOptions) => advertService.getLikedAdverts(options)],
  ['top adverts', (options: ReadOptions) => advertService.getTopAdverts(options)],
  ['dialog list', (options: ReadOptions) => chatService.getChatList(1, options)],
  ['summary', (options: ReadOptions) => chatService.getSummary(2, options)],
  ['interested people', (options: ReadOptions) => likeService.getLikesByAdvertId(7, options)],
] as const)('propagates cancellation to the Axios transport for %s', async (_, read) => {
  const controller = new AbortController();
  const adapter = vi.fn(
    (config: InternalAxiosRequestConfig) =>
      new Promise<AxiosResponse>((_resolve, reject) => {
        expect(config.signal).toBe(controller.signal);
        controller.signal.addEventListener('abort', () => reject(new CanceledError('canceled')), {
          once: true,
        });
      }),
  );
  axiosInstance.defaults.adapter = adapter;
  const request = expect(read({ signal: controller.signal })).rejects.toMatchObject({
    code: 'ERR_CANCELED',
  });
  await vi.waitFor(() => expect(adapter).toHaveBeenCalledOnce());
  controller.abort();
  await request;
});
