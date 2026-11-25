import { CanceledError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import axiosInstance from '@shared/api/client';
import type { ReadOptions } from '@shared/api/cancellation';
import { listingService } from '@entities/listing/api/listingService';
import chatService from '@entities/chat/api/chatListService';
import likeService from '@entities/like/api/likeService';

const originalAdapter = axiosInstance.defaults.adapter;
afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

it.each([
  ['listings', (options: ReadOptions) => listingService.getListings(options)],
  [
    'search',
    (options: ReadOptions) =>
      listingService.getFilteredListings(
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
  ['detail', (options: ReadOptions) => listingService.getListingById(7, options)],
  ['tags', (options: ReadOptions) => listingService.getTagsBySearch('', options)],
  ['own listings', (options: ReadOptions) => listingService.getMine(1, 12, options)],
  ['saved listings', (options: ReadOptions) => listingService.getLikedListings(options)],
  ['top listings', (options: ReadOptions) => listingService.getTopListings(options)],
  ['dialog list', (options: ReadOptions) => chatService.getChatList(1, options)],
  ['summary', (options: ReadOptions) => chatService.getSummary(2, options)],
  ['interested people', (options: ReadOptions) => likeService.getLikesByListingId(7, options)],
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
