import React from 'react';
import { LuHeart, LuPlus, LuUser } from 'react-icons/lu';
import { PersonSummary, PersonSummaryVariant } from '@entities/person/ui/PersonSummary';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import {
  ProfileListingsSection,
  type ProfileCollection,
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

export interface ProfilePageProps {
  profile: ProfileDetails | null;
  favorites: ProfileCollection;
  myListings: ProfileCollection;
  onCreateListing: () => void;
  onEditProfile: () => void;
  onFindListings: () => void;
  onOpenListing: (id: string) => void;
  onSaveListing: (id: string, saved: boolean) => void;
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
  onMessages,
}: ProfilePageProps): JSX.Element {
  const collections = [
    {
      id: 'favorites',
      data: favorites,
      title: 'Избранное',
      emptyTitle: 'Пока нет сохранённых объявлений',
      emptyDescription: 'Сохраняйте понравившиеся объявления, чтобы вернуться к ним позже.',
      emptyAction: 'Найти объявления',
      onEmptyAction: onFindListings,
      icon: <LuHeart />,
    },
    {
      id: 'my-listings',
      data: myListings,
      title: 'Мои объявления',
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
        <ProfileListingsSection
          key={collection.id}
          headingId={collection.id}
          title={collection.title}
          collection={collection.data}
          emptyState={{
            title: collection.emptyTitle,
            description: collection.emptyDescription,
            actionLabel: collection.emptyAction,
            onAction: collection.onEmptyAction,
            icon: collection.icon,
          }}
          onOpenListing={onOpenListing}
          onSaveListing={onSaveListing}
        />
      ))}
    </main>
  );
}
