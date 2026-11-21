import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import {
  selectSavedCollectionError,
  selectSavedStatus,
} from '@entities/advert/model/likedAdvertsSelectors';
import { getLikedAdvertsThunk } from '@entities/advert/model/likedAdvertsThunk';

interface SavedCollectionStatus {
  status: SavedStatus;
  error: string | null;
  reload: () => void;
}

export function useSavedCollectionStatus(): SavedCollectionStatus {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectSavedStatus);
  const error = useAppSelector(selectSavedCollectionError);
  const reload = useCallback((): void => {
    void dispatch(getLikedAdvertsThunk());
  }, [dispatch]);
  return { status, error, reload };
}
