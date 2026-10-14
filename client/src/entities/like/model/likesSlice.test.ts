import { describe, expect, it } from 'vitest';
import likesReducer from './likesSlice';
import { deleteLikeThunk, setLikeThunk } from './likesThunk';

describe('likesSlice', () => {
  it('updates likes after add and delete actions', () => {
    const like = { id: 5, userId: 1, advertId: 7 };
    const added = likesReducer(undefined, setLikeThunk.fulfilled(like, 'request', 7));
    expect(added.likes.map((item) => item.id)).toEqual([5]);

    const deleted = likesReducer(added, deleteLikeThunk.fulfilled(like, 'request', 7));
    expect(deleted.likes).toEqual([]);
  });
});
