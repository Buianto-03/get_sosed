import { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { LikeType } from '@entities/like/model/like';
import { getLikesThunk } from '@entities/like/model/likesThunk';
import { isRequestCanceled } from '@shared/api/cancellation';

enum InterestedPeopleStatus {
  Loading,
  Ready,
  Error,
}

interface InterestedPeopleResult {
  people: LikeType[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}

export function useInterestedPeople(
  listingId: number | null,
  ownerId: number | null,
): InterestedPeopleResult {
  const dispatch = useAppDispatch();
  const people = useAppSelector(
    (state) => (state.likes.advertId === listingId ? state.likes.likes : []),
    shallowEqual,
  );
  const [status, setStatus] = useState(InterestedPeopleStatus.Loading);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (listingId === null) {
      return undefined;
    }
    let active = true;
    setStatus(InterestedPeopleStatus.Loading);
    const request = dispatch(getLikesThunk(listingId));
    void request.unwrap().then(
      () => {
        if (active) {
          setStatus(InterestedPeopleStatus.Ready);
        }
      },
      (error: unknown) => {
        if (active) {
          setStatus(
            isRequestCanceled(error) ? InterestedPeopleStatus.Ready : InterestedPeopleStatus.Error,
          );
        }
      },
    );
    return () => {
      active = false;
      request.abort();
    };
  }, [dispatch, listingId, ownerId, attempt]);

  return {
    people,
    loading: status === InterestedPeopleStatus.Loading,
    error: status === InterestedPeopleStatus.Error,
    retry: () => setAttempt((value) => value + 1),
  };
}
