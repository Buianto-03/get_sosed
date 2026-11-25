import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@app/store/hooks';
import { useSavedCollectionStatus } from '@features/liked-adverts/model/use-saved-collection-status';
import { SavedStatus } from '@entities/listing/model';
import { selectSavedItems } from '@entities/listing/model/likedListingsSelectors';
import { UserStatus } from '@entities/session/model/authModel';
import { routes } from '@shared/config/routes';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { ProfilePage } from '../profile-page/ProfilePage';
import { toProfile } from '../../helper';
import { useMyAdverts } from './use-my-adverts';
import styles from './ProfileRoute.module.scss';

export default function ProfileRoute(): JSX.Element | null {
  const user = useAppSelector((state) => state.auth.user);
  const savedItems = useAppSelector(selectSavedItems);
  const saved = useSavedCollectionStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const profileSaved = (location.state as { profileSaved?: boolean } | null)?.profileSaved;
  const userId = user.status === UserStatus.Logged ? user.id : null;
  const mine = useMyAdverts(userId);
  const openListing = useCallback((id: string) => navigate(routes.listingDetails(id)), [navigate]);
  if (user.status !== UserStatus.Logged) {
    return null;
  }
  return (
    <div className={styles.profile__route}>
      {profileSaved && <Alert variant={AlertVariant.Success}>Профиль сохранён.</Alert>}
      <ProfilePage
        profile={toProfile(user)}
        favorites={{
          items: savedItems.map((item) => item.Advert),
          total: savedItems.length,
          loading: saved.status === SavedStatus.Loading || saved.status === SavedStatus.Idle,
          error: saved.error ?? null,
          onRetry: saved.reload,
        }}
        myListings={{
          items: mine.items,
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
        navigation={{
          onMessages: () => navigate(routes.messages),
          onEditProfile: () => navigate(routes.profileEdit),
          onFindListings: () => navigate(routes.listings),
        }}
        onOpenListing={openListing}
      />
    </div>
  );
}
