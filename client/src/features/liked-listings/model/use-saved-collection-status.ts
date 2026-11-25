import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { savedLoadRequested, type SavedStatus } from '@entities/listing/model';
import {
  selectSavedCollectionError,
  selectSavedStatus,
} from '@entities/listing/model/likedListingsSelectors';

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
