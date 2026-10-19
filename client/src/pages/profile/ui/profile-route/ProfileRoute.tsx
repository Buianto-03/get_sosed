import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@app/store/hooks';
import { useSavedAdverts } from '@features/liked-adverts/model/use-saved-adverts';
import advertService from '@entities/advert/api/advertService';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { UserStatus } from '@entities/session/model/authModel';
import { routes } from '@shared/config/routes';
import { ProfilePage, type ProfileListing } from '../profile-page/ProfilePage';
import { toProfile, toProfileListing } from '../../helper';
import styles from './ProfileRoute.module.scss';

export default function ProfileRoute(): JSX.Element | null {
  const user = useAppSelector((state) => state.auth.user);
  const saved = useSavedAdverts();
  const navigate = useNavigate();
  const [mine, setMine] = useState<AdvertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const userId = user.status === UserStatus.Logged ? user.id : null;
  useEffect(() => {
    let active = true;
    setMine([]);
    setLoading(true);
    setError('');
    if (userId !== null)
      void advertService
        .getMine()
        .then((items) => {
          if (active) setMine(items);
        })
        .catch(() => {
          if (active) setError('Не удалось загрузить ваши объявления.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [userId, attempt]);
  if (user.status !== UserStatus.Logged) return null;
  const cards = (items: AdvertType[]): ProfileListing[] =>
    items.map((advert) => ({
      ...toProfileListing(advert),
      saved: saved.savedIds.includes(advert.id),
      saveDisabled: saved.disabled || !!saved.pending[advert.id],
      saveError: saved.errors[advert.id],
    }));
  return (
    <div className={styles.profile__route}>
      <ProfilePage
        profile={toProfile(user)}
        favorites={cards(saved.items.map((item) => item.Advert))}
        myListings={cards(mine)}
        favoritesLoading={saved.status === SavedStatus.Loading || saved.status === SavedStatus.Idle}
        favoritesError={saved.error}
        myListingsLoading={loading}
        myListingsError={error}
        onRetryMine={() => setAttempt((value) => value + 1)}
        onRetryFavorites={saved.reload}
        onMessages={() => navigate(routes.messages)}
        onCreateListing={() => navigate(routes.listingCreate)}
        onEditProfile={() => navigate(routes.profileEdit)}
        onFindListings={() => navigate(routes.listings)}
        onOpenListing={(id) => navigate(routes.listingDetails(id))}
        onSaveListing={(id) => {
          const advert = [...mine, ...saved.items.map((item) => item.Advert)].find(
            (item) => item.id === Number(id),
          );
          if (advert) saved.toggle(advert);
        }}
      />
    </div>
  );
}
