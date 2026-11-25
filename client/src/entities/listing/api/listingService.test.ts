import { CanceledError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import axiosInstance from '@shared/api/client';
import { listingService } from './listingService';

const originalAdapter = axiosInstance.defaults.adapter;

afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

const filters = {
  city: '',
  district: '',
  metro: '',
  priceFrom: 0,
  priceTo: 0,
  roomsFrom: 0,
  roomsTo: 0,
  tags: [],
};

const listingPage = { items: [], total: 0, page: 1, limit: 8 };
const listing = {
  id: 1,
  title: null,
  body: null,
  price: null,
  userId: null,
  floor: null,
  rooms: null,
  square: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  user: null,
  location: null,
  tags: [],
  photos: [],
};

it('requests default and explicit own-listing pages and parses pagination metadata', async () => {
  const get = vi
    .spyOn(axiosInstance, 'get')
    .mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, limit: 12 } })
    .mockResolvedValueOnce({ data: { items: [], total: 5, page: 2, limit: 5 } });
  expect(await listingService.getMine()).toEqual({ items: [], total: 0, page: 1, limit: 12 });
  expect(get).toHaveBeenNthCalledWith(1, '/listings/mine', { params: { page: 1, limit: 12 } });
  expect(await listingService.getMine(2, 5)).toEqual({ items: [], total: 5, page: 2, limit: 5 });
  expect(get).toHaveBeenNthCalledWith(2, '/listings/mine', { params: { page: 2, limit: 5 } });
});

it.each([
  { data: [] },
  { data: { items: [], total: -1, page: 1, limit: 12 } },
  { data: { items: [], total: 0, page: 0, limit: 12 } },
  { data: { items: [], total: 0, page: 1, limit: 51 } },
])('rejects malformed pagination response %#', async ({ data }) => {
  vi.spyOn(axiosInstance, 'get').mockResolvedValueOnce({ data });
  await expect(listingService.getMine()).rejects.toThrow();
});

it('requests filtered pages with default and explicit pagination and preserves filters', async () => {
  const post = vi
    .spyOn(axiosInstance, 'post')
    .mockResolvedValueOnce({ data: listingPage })
    .mockResolvedValueOnce({ data: { ...listingPage, page: 3, limit: 4 } });

  expect(await listingService.getFilteredListingsPage(filters)).toEqual(listingPage);
  expect(post).toHaveBeenNthCalledWith(1, '/listings/filters/page', filters, {
    params: { page: 1, limit: 8 },
  });
  expect(await listingService.getFilteredListingsPage(filters, 3, 4)).toEqual({
    ...listingPage,
    page: 3,
    limit: 4,
  });
  expect(post).toHaveBeenNthCalledWith(2, '/listings/filters/page', filters, {
    params: { page: 3, limit: 4 },
  });
});

it.each([
  [],
  { ...listingPage, extra: true },
  { ...listingPage, items: 'invalid' },
  { ...listingPage, total: -1 },
  { ...listingPage, total: Number.MAX_SAFE_INTEGER + 1 },
  { ...listingPage, page: 0 },
  { ...listingPage, page: Number.MAX_SAFE_INTEGER + 1 },
  { ...listingPage, limit: 51 },
  { ...listingPage, items: Array.from({ length: 9 }, () => listing) },
  { ...listingPage, items: [{ ...listing, tags: undefined }] },
])('rejects malformed filtered page response %#', async (data) => {
  vi.spyOn(axiosInstance, 'post').mockResolvedValueOnce({ data });
  await expect(listingService.getFilteredListingsPage(filters)).rejects.toThrow();
});

it('requests fresh listings with default and explicit limits and accepts only an array', async () => {
  const get = vi
    .spyOn(axiosInstance, 'get')
    .mockResolvedValueOnce({ data: [] })
    .mockResolvedValueOnce({ data: [] });

  expect(await listingService.getFreshListings()).toEqual([]);
  expect(get).toHaveBeenNthCalledWith(1, '/listings/fresh', { params: { limit: 3 } });
  expect(await listingService.getFreshListings(2)).toEqual([]);
  expect(get).toHaveBeenNthCalledWith(2, '/listings/fresh', { params: { limit: 2 } });

  vi.spyOn(axiosInstance, 'get').mockResolvedValueOnce({ data: { items: [] } });
  await expect(listingService.getFreshListings()).rejects.toThrow();
});

it('parses the canonical listing response fields directly', async () => {
  vi.spyOn(axiosInstance, 'get').mockResolvedValueOnce({
    data: {
      ...listing,
      location: {
        id: 1,
        listingId: listing.id,
        city: null,
        district: null,
        address: null,
        metro: null,
        coordinates: null,
      },
      photos: [
        { id: 2, listingId: listing.id, photo: null },
      ],
    },
  });

  await expect(listingService.getListingById(listing.id)).resolves.toMatchObject({
    location: { listingId: listing.id },
    photos: [{ id: 2, listingId: listing.id }],
  });
});

it.each([
  (options: { signal: AbortSignal }) => listingService.getFilteredListingsPage(filters, 1, 8, options),
  (options: { signal: AbortSignal }) => listingService.getFreshListings(3, options),
])('passes request cancellation through to the Axios adapter', async (read) => {
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
