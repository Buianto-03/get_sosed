import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@app/store/hooks';
import { useSavedAdverts } from '@features/liked-adverts/model/use-saved-adverts';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { UserStatus } from '@entities/session/model/authModel';
import { routes } from '@shared/config/routes';
import { ProfilePage, type ProfileListing } from '../profile-page/ProfilePage';
import { toProfile, toProfileListing } from '../../helper';
import { useMyAdverts } from './use-my-adverts';
import styles from './ProfileRoute.module.scss';

export default function ProfileRoute(): JSX.Element | null {
  const user = useAppSelector((state) => state.auth.user);
  const saved = useSavedAdverts();
  const navigate = useNavigate();
  const userId = user.status === UserStatus.Logged ? user.id : null;
  const mine = useMyAdverts(userId);
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
        favorites={{
          items: cards(saved.items.map((item) => item.Advert)),
          total: saved.items.length,
          loading: saved.status === SavedStatus.Loading || saved.status === SavedStatus.Idle,
          error: saved.error ?? null,
          onRetry: saved.reload,
        }}
        myListings={{
          items: cards(mine.items),
          total: mine.total,
          loading: mine.loading,
          error: mine.error ?? null,
          onRetry: mine.retry,
          pagination: {
            hasMore: mine.hasMore,
            loading: mine.loadingMore,
            error: mine.loadMoreError || null,
            onLoadMore: () => {
              void mine.loadMore();
            },
          },
        }}
        onMessages={() => navigate(routes.messages)}
        onCreateListing={() => navigate(routes.listingCreate)}
        onEditProfile={() => navigate(routes.profileEdit)}
        onFindListings={() => navigate(routes.listings)}
        onOpenListing={(id) => navigate(routes.listingDetails(id))}
        onSaveListing={(id) => {
          const advert = [...mine.items, ...saved.items.map((item) => item.Advert)].find(
            (item) => item.id === Number(id),
          );
          if (advert) saved.toggle(advert);
        }}
      />
    </div>
  );
}
