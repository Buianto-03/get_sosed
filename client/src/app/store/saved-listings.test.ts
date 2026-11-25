import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@shared/api/client';
import likeService from '@entities/like/api/likeService';
import { clearAuth, setAccessToken, setSession } from '@entities/session/model/authSlice';
import { checkAuthThunk } from '@entities/session/model/authThunk';
import {
  SavedStatus,
  getLikedListingsThunk,
  savedLoadRequested,
  type Listing,
} from '@entities/listing/model';
import {
  selectIsSaved,
  selectSaveError,
  selectSavePending,
} from '@entities/listing/model/likedListingsSelectors';
import { removeSavedListingThunk, saveListingThunk } from '@features/liked-listings/model';
import { store } from './store';

const listing: Listing = {
  id: 7,
  title: 'Комната',
  body: null,
  price: 100,
  userId: 4,
  floor: null,
  rooms: null,
  square: null,
  createdAt: '',
  updatedAt: '',
  user: null,
  location: null,
  photos: [],
};
const like = { id: 15, listingId: 7, userId: 1 };
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const login = (id: number): void => {
  store.dispatch(
    setSession({ accessToken: 'token', user: { id, name: 'User', email: 'a@b.c', roleId: 1 } }),
  );
};
const ready = async (): Promise<void> => {
  vi.spyOn(axiosInstance, 'get').mockResolvedValue({ data: [] });
  login(1);
  await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Ready));
};
afterEach(() => {
  store.dispatch(clearAuth());
  vi.restoreAllMocks();
});

describe('shared saved listings', () => {
  it('confirms save/delete once and updates both IDs and profile cards', async () => {
    await ready();
    const response = deferred<typeof like>();
    const post = vi.spyOn(likeService, 'setLike').mockReturnValue(response.promise);
    const request = store.dispatch(saveListingThunk(listing));
    expect(selectIsSaved(store.getState(), 7)).toBe(false);
    expect((await store.dispatch(saveListingThunk(listing))).meta.requestStatus).toBe('rejected');
    expect(post).toHaveBeenCalledTimes(1);
    // A profile reload cannot overwrite an in-flight mutation.
    expect((await store.dispatch(getLikedListingsThunk())).meta.requestStatus).toBe('rejected');
    response.resolve(like);
    await request.unwrap();
    expect(selectIsSaved(store.getState(), 7)).toBe(true);
    expect(store.getState().likedListings.items[0].listing).toEqual(listing);
    vi.spyOn(likeService, 'deleteLike').mockResolvedValue({ listingId: 7, deleted: false });
    await store.dispatch(removeSavedListingThunk(7)).unwrap();
    expect(selectIsSaved(store.getState(), 7)).toBe(false);
    expect(store.getState().likedListings.items).toEqual([]);
  });
  it('preserves confirmed state on mutation errors and retries loading', async () => {
    vi.spyOn(axiosInstance, 'get')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ data: [] });
    login(1);
    await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Error));
    await store.dispatch(getLikedListingsThunk()).unwrap();
    vi.spyOn(likeService, 'setLike')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(like);
    await store.dispatch(saveListingThunk(listing));
    expect(selectIsSaved(store.getState(), 7)).toBe(false);
    expect(store.getState().likedListings.errors[7]).toBeTruthy();
    await store.dispatch(saveListingThunk(listing)).unwrap();
    vi.spyOn(likeService, 'deleteLike').mockRejectedValue(new Error('offline'));
    await store.dispatch(removeSavedListingThunk(7));
    expect(selectIsSaved(store.getState(), 7)).toBe(true);
    expect(store.getState().likedListings.items).toHaveLength(1);
  });

  it('keeps independent pending, error and confirmed values for concurrent IDs', async () => {
    await ready();
    const response = deferred<typeof like>();
    const otherListing = { ...listing, id: 8 };
    const otherLike = { ...like, id: 16, listingId: otherListing.id };
    const setLike = vi
      .spyOn(likeService, 'setLike')
      .mockReturnValueOnce(response.promise)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(otherLike);
    const first = store.dispatch(saveListingThunk(listing));
    const second = store.dispatch(saveListingThunk(otherListing));

    expect(selectSavePending(store.getState(), listing.id)).toBe(true);
    expect(selectSavePending(store.getState(), otherListing.id)).toBe(true);
    expect((await second).meta.requestStatus).toBe('rejected');
    expect(selectSavePending(store.getState(), listing.id)).toBe(true);
    expect(selectSaveError(store.getState(), listing.id)).toBeUndefined();
    expect(selectSavePending(store.getState(), otherListing.id)).toBe(false);
    expect(selectSaveError(store.getState(), otherListing.id)).toBeTruthy();

    await store.dispatch(saveListingThunk(otherListing)).unwrap();
    expect(selectIsSaved(store.getState(), otherListing.id)).toBe(true);
    expect(selectIsSaved(store.getState(), listing.id)).toBe(false);
    expect(selectSaveError(store.getState(), otherListing.id)).toBeUndefined();
    response.resolve(like);
    await first.unwrap();
    expect(selectIsSaved(store.getState(), listing.id)).toBe(true);
    expect(selectIsSaved(store.getState(), otherListing.id)).toBe(true);
    expect(setLike.mock.calls).toEqual([[listing.id], [otherListing.id], [otherListing.id]]);
  });
  it('clears on account change and ignores the old list, including same-user re-login', async () => {
    const old = deferred<{ data: unknown }>();
    vi.spyOn(axiosInstance, 'get').mockReturnValueOnce(old.promise).mockResolvedValue({ data: [] });
    login(1);
    store.dispatch(clearAuth());
    expect(store.getState().likedListings.items).toEqual([]);
    login(1);
    await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Ready));
    old.resolve({ data: [{ ...like, listing }] });
    await old.promise;
    await new Promise((done) => {
      setTimeout(done, 0);
    });
    expect(store.getState().likedListings.items).toEqual([]);
  });
  it('keeps data on token refresh and resets immediately on restored/expired sessions', async () => {
    const getRequests = vi.spyOn(axiosInstance, 'get').mockResolvedValue({ data: [] });
    login(1);
    await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Ready));
    vi.spyOn(likeService, 'setLike').mockResolvedValue(like);
    await store.dispatch(saveListingThunk(listing)).unwrap();
    store.dispatch(setAccessToken('refreshed-token'));
    login(1);
    expect(selectIsSaved(store.getState(), 7)).toBe(true);
    expect(getRequests).toHaveBeenCalledTimes(1);

    store.dispatch(
      checkAuthThunk.fulfilled(
        {
          accessToken: 'other-token',
          user: { id: 2, name: 'Other', email: 'other@b.c', roleId: 1 },
        },
        'restore',
        undefined,
      ),
    );
    expect(store.getState().likedListings.items).toEqual([]);
    expect(store.getState().likes.userId).toBe(2);
    expect(getRequests).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Ready));

    store.dispatch(checkAuthThunk.rejected(new Error('expired'), 'expired', undefined));
    expect(store.getState().likedListings.status).toBe(SavedStatus.Idle);
    expect(store.getState().likes.userId).toBeNull();
  });
  it('ignores a confirmed mutation from a previous account', async () => {
    await ready();
    const old = deferred<typeof like>();
    vi.spyOn(likeService, 'setLike').mockReturnValue(old.promise);
    const request = store.dispatch(saveListingThunk(listing));
    login(2);
    await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Ready));
    old.resolve(like);
    await request;
    expect(store.getState().likedListings.items).toEqual([]);
    expect(store.getState().likes.likes).toEqual([]);
  });
});

it('owns shared reads across retries and aborts them only when the session changes', async () => {
  const get = vi
    .spyOn(axiosInstance, 'get')
    .mockResolvedValueOnce({ data: [] })
    .mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Pending until its owner cancels. */
        }),
    )
    .mockResolvedValueOnce({ data: [] });
  login(1);
  await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Ready));
  store.dispatch(savedLoadRequested());
  const signal = get.mock.calls[1][1]?.signal;
  expect(signal?.aborted).toBe(false);
  store.dispatch(savedLoadRequested());
  expect(get).toHaveBeenCalledTimes(2);
  expect(signal?.aborted).toBe(false);
  login(2);
  expect(signal?.aborted).toBe(true);
  await vi.waitFor(() => expect(store.getState().likedListings.status).toBe(SavedStatus.Ready));
  expect(store.getState().likedListings.items).toEqual([]);
  expect(get).toHaveBeenCalledTimes(3);
});

it('keeps an initialized empty saved collection ready after a canceled reload', async () => {
  await ready();
  vi.spyOn(axiosInstance, 'get').mockImplementationOnce(
    () =>
      new Promise(() => {
        /* Pending until its owner cancels. */
      }),
  );
  const request = store.dispatch(getLikedListingsThunk());
  request.abort();
  await request;
  expect(store.getState().likedListings).toMatchObject({
    status: SavedStatus.Ready,
    items: [],
    initialized: true,
    error: null,
    requestId: null,
  });
});
