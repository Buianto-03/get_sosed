import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@shared/api/client';
import likeService from '@entities/like/api/likeService';
import { clearAuth, setAccessToken, setSession } from '@entities/session/model/authSlice';
import { checkAuthThunk } from '@entities/session/model/thunks';
import type { AdvertType } from '@entities/advert/model/advert';
import { removeSavedAdvertThunk, saveAdvertThunk } from '@features/liked-adverts/model';
import { selectIsSaved } from '@entities/advert/model/likedAdvertsSelectors';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { getLikedAdvertsThunk } from '@entities/advert/model/likedAdvertsThunk';
import { store } from './store';

const advert: AdvertType = {
  id: 7, title: 'Комната', body: null, price: 100, userId: 4, floor: null, rooms: null,
  square: null, createdAt: '', updatedAt: '', user: null, location: null, AdvertPhotos: [],
};
const like = { id: 15, advertId: 7, userId: 1 };
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const login = (id: number): void => {
  store.dispatch(setSession({ accessToken: 'token', user: { id, name: 'User', email: 'a@b.c', roleId: 1 } }));
};
const ready = async (): Promise<void> => {
  vi.spyOn(axiosInstance, 'get').mockResolvedValue({ data: [] });
  login(1);
  await vi.waitFor(() => expect(store.getState().likedAdverts.status).toBe(SavedStatus.Ready));
};
afterEach(() => { store.dispatch(clearAuth()); vi.restoreAllMocks(); });

describe('shared saved adverts', () => {
  it('confirms save/delete once and updates both IDs and profile cards', async () => {
    await ready();
    const response = deferred<typeof like>();
    const post = vi.spyOn(likeService, 'setLike').mockReturnValue(response.promise);
    const request = store.dispatch(saveAdvertThunk(advert));
    expect(selectIsSaved(store.getState(), 7)).toBe(false);
    expect((await store.dispatch(saveAdvertThunk(advert))).meta.requestStatus).toBe('rejected');
    expect(post).toHaveBeenCalledTimes(1);
    // A profile reload cannot overwrite an in-flight mutation.
    expect((await store.dispatch(getLikedAdvertsThunk())).meta.requestStatus).toBe('rejected');
    response.resolve(like);
    await request.unwrap();
    expect(selectIsSaved(store.getState(), 7)).toBe(true);
    expect(store.getState().likedAdverts.items[0].Advert).toEqual(advert);
    vi.spyOn(likeService, 'deleteLike').mockResolvedValue({ advertId: 7, deleted: false });
    await store.dispatch(removeSavedAdvertThunk(7)).unwrap();
    expect(selectIsSaved(store.getState(), 7)).toBe(false);
    expect(store.getState().likedAdverts.items).toEqual([]);
  });
  it('preserves confirmed state on mutation errors and retries loading', async () => {
    vi.spyOn(axiosInstance, 'get').mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ data: [] });
    login(1);
    await vi.waitFor(() => expect(store.getState().likedAdverts.status).toBe(SavedStatus.Error));
    await store.dispatch(getLikedAdvertsThunk()).unwrap();
    vi.spyOn(likeService, 'setLike').mockRejectedValueOnce(new Error('offline')).mockResolvedValue(like);
    await store.dispatch(saveAdvertThunk(advert));
    expect(selectIsSaved(store.getState(), 7)).toBe(false);
    expect(store.getState().likedAdverts.errors[7]).toBeTruthy();
    await store.dispatch(saveAdvertThunk(advert)).unwrap();
    vi.spyOn(likeService, 'deleteLike').mockRejectedValue(new Error('offline'));
    await store.dispatch(removeSavedAdvertThunk(7));
    expect(selectIsSaved(store.getState(), 7)).toBe(true);
    expect(store.getState().likedAdverts.items).toHaveLength(1);
  });
  it('clears on account change and ignores the old list, including same-user re-login', async () => {
    const old = deferred<{ data: unknown }>();
    vi.spyOn(axiosInstance, 'get').mockReturnValueOnce(old.promise).mockResolvedValue({ data: [] });
    login(1);
    store.dispatch(clearAuth());
    expect(store.getState().likedAdverts.items).toEqual([]);
    login(1);
    await vi.waitFor(() => expect(store.getState().likedAdverts.status).toBe(SavedStatus.Ready));
    old.resolve({ data: [{ ...like, Advert: advert }] });
    await old.promise;
    await new Promise((done) => { setTimeout(done, 0); });
    expect(store.getState().likedAdverts.items).toEqual([]);
  });
  it('keeps data on token refresh and resets immediately on restored/expired sessions', async () => {
    const getRequests = vi.spyOn(axiosInstance, 'get').mockResolvedValue({ data: [] });
    login(1);
    await vi.waitFor(() => expect(store.getState().likedAdverts.status).toBe(SavedStatus.Ready));
    vi.spyOn(likeService, 'setLike').mockResolvedValue(like);
    await store.dispatch(saveAdvertThunk(advert)).unwrap();
    store.dispatch(setAccessToken('refreshed-token'));
    login(1);
    expect(selectIsSaved(store.getState(), 7)).toBe(true);
    expect(getRequests).toHaveBeenCalledTimes(1);

    store.dispatch(checkAuthThunk.fulfilled({
      accessToken: 'other-token',
      user: { id: 2, name: 'Other', email: 'other@b.c', roleId: 1 },
    }, 'restore', undefined));
    expect(store.getState().likedAdverts.items).toEqual([]);
    expect(store.getState().likes.userId).toBe(2);
    expect(getRequests).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(store.getState().likedAdverts.status).toBe(SavedStatus.Ready));

    store.dispatch(checkAuthThunk.rejected(new Error('expired'), 'expired', undefined));
    expect(store.getState().likedAdverts.status).toBe(SavedStatus.Idle);
    expect(store.getState().likes.userId).toBeNull();
  });
  it('ignores a confirmed mutation from a previous account', async () => {
    await ready();
    const old = deferred<typeof like>();
    vi.spyOn(likeService, 'setLike').mockReturnValue(old.promise);
    const request = store.dispatch(saveAdvertThunk(advert));
    login(2);
    await vi.waitFor(() => expect(store.getState().likedAdverts.status).toBe(SavedStatus.Ready));
    old.resolve(like);
    await request;
    expect(store.getState().likedAdverts.items).toEqual([]);
    expect(store.getState().likes.likes).toEqual([]);
  });
});
