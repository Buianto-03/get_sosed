import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import {
  selectSavedCollectionError,
  selectSavedStatus,
} from '@entities/advert/model/likedAdvertsSelectors';
import { savedLoadRequested } from '@entities/advert/model/likedAdvertsSlice';

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
    dispatch(savedLoadRequested());
  }, [dispatch]);
  return { status, error, reload };
}
