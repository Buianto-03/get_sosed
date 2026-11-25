import { describe, expect, it } from 'vitest';
import likesReducer, { resetLikes } from './likesSlice';
import { deleteLikeThunk, getLikesThunk, setLikeThunk } from './likesThunk';
import { deleteLikeSchema } from './like';

describe('likesSlice', () => {
  it('deduplicates likes and deletes by listing ID even when already absent on server', () => {
    const like = { id: 5, userId: 1, listingId: 7 };
    let state = likesReducer(undefined, resetLikes(1));
    state = likesReducer(state, getLikesThunk.pending('read', 7));
    state = likesReducer(state, getLikesThunk.fulfilled([like, { id: 6, userId: 2, listingId: 7 }], 'read', 7));
    state = likesReducer(state, setLikeThunk.pending('add', 7));
    state = likesReducer(state, setLikeThunk.fulfilled(like, 'add', 7));
    expect(state.likes.map((item) => item.id)).toEqual([5, 6]);
    state = likesReducer(state, deleteLikeThunk.pending('delete', 7));
    state = likesReducer(state, deleteLikeThunk.fulfilled({ listingId: 7, deleted: false }, 'delete', 7));
    expect(state.likes.map((item) => item.id)).toEqual([6]);
  });
  it('ignores mutations from a cleared session and another listing', () => {
    let state = likesReducer(undefined, setLikeThunk.pending('old', 7));
    state = likesReducer(state, resetLikes(null));
    state = likesReducer(state, setLikeThunk.fulfilled({ id: 5, userId: 1, listingId: 7 }, 'old', 7));
    expect(state.likes).toEqual([]);
    state = likesReducer(state, getLikesThunk.pending('new-page', 8));
    state = likesReducer(state, setLikeThunk.pending('add', 7));
    state = likesReducer(state, setLikeThunk.fulfilled({ id: 5, userId: 1, listingId: 7 }, 'add', 7));
    expect(state.likes).toEqual([]);
  });
  it('validates the separate DELETE contract', () => {
    expect(deleteLikeSchema.parse({ listingId: 7, deleted: false })).toEqual({ listingId: 7, deleted: false });
    expect(deleteLikeSchema.safeParse({}).success).toBe(false);
    expect(deleteLikeSchema.safeParse({ id: 1, userId: 2, listingId: 7 }).success).toBe(false);
  });
});
