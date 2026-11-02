import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import { UserStatus } from '@entities/session/model/authModel';
import { routes } from '@shared/config/routes';
import { selectSavedAdverts } from '@entities/advert/model/likedAdvertsSelectors';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { getLikedAdvertsThunk } from '@entities/advert/model/likedAdvertsThunk';
import { removeSavedAdvertThunk, saveAdvertThunk } from '../model';

interface SavedAdvertsControls extends ReturnType<typeof selectSavedAdverts> {
  toggle: (advert: AdvertType) => void;
  disabled: boolean;
  reload: () => void;
}

export function useSavedAdverts(): SavedAdvertsControls {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectSavedAdverts);
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = user.status === UserStatus.Logged;
  const toggle = (advert: AdvertType): void => {
    if (!isLoggedIn) {
      const returnTo = location.pathname + location.search + location.hash;
      navigate(`${routes.signIn}?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    const request = saved.savedIds.includes(advert.id)
      ? dispatch(removeSavedAdvertThunk(advert.id))
      : dispatch(saveAdvertThunk(advert));
    // Errors are recorded in the shared state beside the affected advert ID.
    void request.unwrap().catch(() => undefined);
  };
  return {
    ...saved,
    toggle,
    disabled: isLoggedIn && saved.status !== SavedStatus.Ready,
    reload: (): void => { void dispatch(getLikedAdvertsThunk()); },
  };
}
