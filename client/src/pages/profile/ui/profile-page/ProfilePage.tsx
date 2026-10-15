import React from 'react';
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
};

export type ProfilePageProps = {
  profile: ProfileDetails | null;
  favorites: readonly ProfileListing[];
  myListings: readonly ProfileListing[];
  onCreateListing: () => void;
  onEditProfile: () => void;
  onFindListings: () => void;
  onOpenListing: (id: string) => void;
  onSaveListing: (id: string, saved: boolean) => void;
};

export function ProfilePage({
  profile,
  favorites,
  myListings,
  onCreateListing,
  onEditProfile,
  onFindListings,
  onOpenListing,
  onSaveListing,
}: ProfilePageProps): JSX.Element {
  const collections = [
    {
      id: 'favorites',
      title: 'Избранное',
      listings: favorites,
      emptyTitle: 'Пока нет сохранённых объявлений',
      emptyDescription: 'Сохраняйте понравившиеся объявления, чтобы вернуться к ним позже.',
      emptyAction: 'Найти объявления',
      onEmptyAction: onFindListings,
      icon: <LuHeart />,
    },
    {
      id: 'my-listings',
      title: 'Мои объявления',
      listings: myListings,
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
              <span className={styles.count}>{collection.listings.length}</span>
            )}
          </div>
          {collection.listings.length > 0 ? (
            <div className={styles.listingGrid}>
              {collection.listings.map(({ id, listing, saved }) => (
                <ListingCard
                  key={id}
                  listing={listing}
                  variant={ListingCardVariant.Profile}
                  saved={saved}
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
          )}
        </section>
      ))}
    </main>
  );
}
