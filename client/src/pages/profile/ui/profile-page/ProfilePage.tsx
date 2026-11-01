import React from 'react';
import { LuHeart, LuPlus, LuUser } from 'react-icons/lu';
import { PersonSummary, PersonSummaryVariant } from '@entities/person/ui/PersonSummary';
import { CreateListingButton } from '@features/listing-create/ui/create-listing-button/CreateListingButton';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import {
  ProfileListingsSection,
  type ProfileCollection,
  type ProfileListingActions,
} from '../profile-listings-section/ProfileListingsSection';
import styles from './ProfilePage.module.scss';

export type {
  ProfileListing,
  ProfileCollection,
} from '../profile-listings-section/ProfileListingsSection';

export type ProfileDetails = {
  name: string;
  city?: string;
  intent?: string;
  description?: string;
  habits?: readonly string[];
  avatarUrl?: string;
};

export interface ProfileNavigation {
  onEditProfile: () => void;
  onFindListings: () => void;
  onMessages?: () => void;
}

export interface ProfilePageProps {
  profile: ProfileDetails | null;
  favorites: ProfileCollection;
  myListings: ProfileCollection;
  navigation: ProfileNavigation;
  listingActions: ProfileListingActions;
}

export function ProfilePage({
  profile,
  favorites,
  myListings,
  navigation,
  listingActions,
}: ProfilePageProps): JSX.Element {
  const collections = [
    {
      id: 'favorites',
      data: favorites,
      title: 'Избранное',
      emptyTitle: 'Пока нет сохранённых объявлений',
      emptyDescription: 'Сохраняйте понравившиеся объявления, чтобы вернуться к ним позже.',
      emptyAction: (
        <Button variant={ButtonVariant.Secondary} onClick={navigation.onFindListings}>
          Найти объявления
        </Button>
      ),
      icon: <LuHeart />,
    },
    {
      id: 'my-listings',
      data: myListings,
      title: 'Мои объявления',
      emptyTitle: 'Здесь будут ваши объявления',
      emptyDescription: 'Расскажите о жилье, чтобы найти подходящего соседа.',
      emptyAction: <CreateListingButton variant={ButtonVariant.Secondary} />,
      icon: <LuPlus />,
    },
  ];

  return (
    <main className={styles.profile}>
      <div className={styles.profile__heading}>
        <div>
          <p className={styles.profile__eyebrow}>Личный кабинет</p>
          <Heading level={HeadingLevel.H1} size={HeadingSize.Xl}>
            Мой профиль
          </Heading>
        </div>
        <div className={styles.profile__actions}>
          {navigation.onMessages && (
            <Button variant={ButtonVariant.Secondary} onClick={navigation.onMessages}>
              Сообщения
            </Button>
          )}
          <CreateListingButton className={styles.profile__create} withIcon />
        </div>
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
            <Button variant={ButtonVariant.Secondary} onClick={navigation.onEditProfile}>
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
            <Button variant={ButtonVariant.Secondary} onClick={navigation.onEditProfile}>
              Заполнить профиль
            </Button>
          }
        />
      )}

      <div className={styles.profile__collections}>
        {collections.map((collection) => (
          <ProfileListingsSection
            key={collection.id}
            headingId={collection.id}
            title={collection.title}
            collection={collection.data}
            emptyState={{
              title: collection.emptyTitle,
              description: collection.emptyDescription,
              action: collection.emptyAction,
              icon: collection.icon,
            }}
            actions={listingActions}
          />
        ))}
      </div>
    </main>
  );
}
