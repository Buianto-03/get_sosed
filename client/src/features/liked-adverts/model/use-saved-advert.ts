import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { SavedStatus, type Listing } from '@entities/listing/model';
import {
  selectIsSaved,
  selectSavedStatus,
  selectSaveError,
  selectSavePending,
} from '@entities/listing/model/likedListingsSelectors';
import { selectIsLoggedIn } from '@entities/session/model/authSelectors';
import { routes } from '@shared/config/routes';
import { removeSavedAdvertThunk, saveAdvertThunk } from '../model';

interface SavedAdvertControls {
  saved: boolean;
  disabled: boolean;
  error: string | undefined;
  toggle: (advert: Listing) => void;
}

export function useSavedAdvert(id: number): SavedAdvertControls {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const saved = useAppSelector((state) => selectIsSaved(state, id));
  const error = useAppSelector((state) => selectSaveError(state, id));
  const disabled = useAppSelector(
    (state) =>
      selectSavePending(state, id) ||
      (selectIsLoggedIn(state) && selectSavedStatus(state) !== SavedStatus.Ready),
  );
  const location = useLocation();
  const navigate = useNavigate();

  const toggle = (advert: Listing): void => {
    if (advert.id !== id || disabled) {
      return;
    }
    if (!isLoggedIn) {
      const returnTo = location.pathname + location.search + location.hash;
      navigate(`${routes.signIn}?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    const request = saved
      ? dispatch(removeSavedAdvertThunk(id))
      : dispatch(saveAdvertThunk(advert));
    // Errors are recorded in the shared state beside the affected advert ID.
    void request.unwrap().catch(() => undefined);
  };

  return { saved, disabled, error, toggle };
}
