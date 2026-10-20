import React from 'react';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Spinner } from '@shared/ui/feedback/Spinner';
import { LuHeart, LuPlus, LuUser } from 'react-icons/lu';
import { PersonSummary, PersonSummaryVariant } from '@entities/person/ui/PersonSummary';
import {
  ListingCard,
  ListingCardVariant,
  type ListingCardData,
} from '@entities/listing/ui/listing-card/ListingCard';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import styles from './ProfilePage.module.scss';

export type ProfileDetails = {
  name: string;
  city?: string;
  intent?: string;
  description?: string;
  habits?: readonly string[];
  avatarUrl?: string;
};

export type ProfileListing = {
  id: string;
  listing: ListingCardData;
  saved: boolean;
  saveDisabled?: boolean;
  saveError?: string;
};

export interface ProfilePageProps {
  profile: ProfileDetails | null;
  favorites: readonly ProfileListing[];
  myListings: readonly ProfileListing[];
  onCreateListing: () => void;
  onEditProfile: () => void;
  onFindListings: () => void;
  onOpenListing: (id: string) => void;
  onSaveListing: (id: string, saved: boolean) => void;
  favoritesLoading?: boolean;
  favoritesError?: string | null;
  myListingsLoading?: boolean;
  myListingsError?: string | null;
  myListingsTotal?: number;
  myListingsHasMore?: boolean;
  myListingsLoadingMore?: boolean;
  myListingsLoadMoreError?: string;
  onLoadMoreMine?: () => void;
  onRetryFavorites?: () => void;
  onRetryMine?: () => void;
  onMessages?: () => void;
}

export function ProfilePage({
  profile,
  favorites,
  myListings,
  onCreateListing,
  onEditProfile,
  onFindListings,
  onOpenListing,
  onSaveListing,
  favoritesLoading,
  favoritesError,
  myListingsLoading,
  myListingsError,
  myListingsTotal,
  myListingsHasMore,
  myListingsLoadingMore,
  myListingsLoadMoreError,
  onLoadMoreMine,
  onRetryFavorites,
  onRetryMine,
  onMessages,
}: ProfilePageProps): JSX.Element {
  const collections = [
    {
      id: 'favorites',
      loading: favoritesLoading,
      error: favoritesError,
      retry: onRetryFavorites,
      title: 'Избранное',
      listings: favorites,
      total: favorites.length,
      emptyTitle: 'Пока нет сохранённых объявлений',
      emptyDescription: 'Сохраняйте понравившиеся объявления, чтобы вернуться к ним позже.',
      emptyAction: 'Найти объявления',
      onEmptyAction: onFindListings,
      icon: <LuHeart />,
    },
    {
      id: 'my-listings',
      loading: myListingsLoading,
      error: myListingsError,
      retry: onRetryMine,
      title: 'Мои объявления',
      listings: myListings,
      total: myListingsTotal ?? myListings.length,
      emptyTitle: 'Здесь будут ваши объявления',
      emptyDescription: 'Расскажите о жилье, чтобы найти подходящего соседа.',
      emptyAction: 'Разместить объявление',
      onEmptyAction: onCreateListing,
      icon: <LuPlus />,
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Личный кабинет</p>
          <Heading level={HeadingLevel.H1} size={HeadingSize.Xl}>
            Профиль
          </Heading>
        </div>
        <Button className={styles.createButton} onClick={onCreateListing}>
          <LuPlus aria-hidden="true" />
          Разместить объявление
        </Button>
      </div>

      {onMessages && (
        <Button variant={ButtonVariant.Secondary} onClick={onMessages}>
          Сообщения
        </Button>
      )}
      {profile ? (
        <PersonSummary
          name={profile.name}
          avatarUrl={profile.avatarUrl}
          city={[profile.city, profile.intent].filter(Boolean).join(' · ')}
          description={profile.description}
          tags={profile.habits ? [...profile.habits] : []}
          variant={PersonSummaryVariant.Profile}
          action={
            <Button variant={ButtonVariant.Secondary} onClick={onEditProfile}>
              Изменить профиль
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Расскажите о себе"
          description="Добавьте город, пару слов о себе и привычки, чтобы будущим соседям было проще познакомиться с вами."
          icon={<LuUser />}
          action={
            <Button variant={ButtonVariant.Secondary} onClick={onEditProfile}>
              Заполнить профиль
            </Button>
          }
        />
      )}

      {collections.map((collection) => (
        <section key={collection.id} className={styles.collection} aria-labelledby={collection.id}>
          <div className={styles.collectionHeading}>
            <Heading
              level={HeadingLevel.H2}
              size={HeadingSize.Lg}
              className={styles.collectionTitle}
            >
              <span id={collection.id}>{collection.title}</span>
            </Heading>
            {collection.listings.length > 0 && (
              <span className={styles.count}>{collection.total}</span>
            )}
          </div>
          {collection.loading && <Spinner label={`Загрузка: ${collection.title}`} />}
          {!collection.loading && collection.error && (
            <>
              <Alert variant={AlertVariant.Error}>{collection.error}</Alert>
              <Button onClick={collection.retry}>Повторить</Button>
            </>
          )}
          {!collection.loading &&
            !collection.error &&
            (collection.listings.length > 0 ? (
              <div className={styles.listingGrid}>
                {collection.listings.map(({ id, listing, saved, saveDisabled, saveError }) => (
                  <ListingCard
                    key={id}
                    listing={listing}
                    variant={ListingCardVariant.Profile}
                    saved={saved}
                    saveDisabled={saveDisabled}
                    saveError={saveError}
                    onSavedChange={(nextSaved) => onSaveListing(id, nextSaved)}
                    onOpen={() => onOpenListing(id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={collection.emptyTitle}
                description={collection.emptyDescription}
                icon={collection.icon}
                action={
                  <Button variant={ButtonVariant.Secondary} onClick={collection.onEmptyAction}>
                    {collection.emptyAction}
                  </Button>
                }
              />
            ))}
          {collection.id === 'my-listings' &&
            !collection.loading &&
            !collection.error &&
            myListingsHasMore && (
            <div className={styles.collection__pagination}>
              {myListingsLoadMoreError && (
                <Alert variant={AlertVariant.Error}>{myListingsLoadMoreError}</Alert>
              )}
              <Button
                variant={ButtonVariant.Secondary}
                loading={myListingsLoadingMore}
                onClick={onLoadMoreMine}
              >
                {myListingsLoadMoreError ? 'Повторить загрузку' : 'Показать ещё'}
              </Button>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
