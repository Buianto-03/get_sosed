import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { ListingHeader } from '@widgets/listing-header/ListingHeader';
import { ListingDetails } from '@widgets/listing-details/listing-details/ListingDetails';
import { PersonSummary } from '@entities/person/ui/PersonSummary';
import { getAdvertByIdThunk } from '@entities/advert/model/advertsThunk';
import { AdvertDetailStatus } from '@entities/advert/model/advertsModel';
import { selectAdverts } from '@entities/advert/model/advertsSelectors';
import { getLikesThunk } from '@entities/like/model/likesThunk';
import { UserStatus } from '@entities/session/model/authModel';
import { useSavedAdverts } from '@features/liked-adverts/model/use-saved-adverts';
import { Button } from '@shared/ui/button/Button';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Spinner } from '@shared/ui/feedback/Spinner';
import { YMap } from '@shared/ui/y-map/YMap';
import { getMediaUrl } from '@shared/config/media';
import { routes } from '@shared/config/routes';
import { getAuthenticationPath } from '@shared/lib/navigation/safe-return-to';
import { searchDestination } from './helper';
import styles from './ListingRoute.module.scss';

export default function ListingRoute(): JSX.Element {
  const { listingId } = useParams();
  const id = Number(listingId);
  const valid = !!listingId && /^[1-9]\d*$/.test(listingId) && Number.isSafeInteger(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const data = useAppSelector(selectAdverts);
  const user = useAppSelector((state) => state.auth.user);
  const likes = useAppSelector((state) => state.likes);
  const saved = useSavedAdverts();
  const [attempt, setAttempt] = useState(0);
  const [likesLoading, setLikesLoading] = useState(true);
  const [likesError, setLikesError] = useState(false);
  const [likesAttempt, setLikesAttempt] = useState(0);
  useEffect(() => {
    if (valid) void dispatch(getAdvertByIdThunk(id));
  }, [dispatch, id, valid, attempt]);
  useEffect(() => {
    if (!valid) return undefined;
    let active = true;
    setLikesLoading(true);
    setLikesError(false);
    void dispatch(getLikesThunk(id))
      .unwrap()
      .catch(() => {
        if (active) setLikesError(true);
      })
      .finally(() => {
        if (active) setLikesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, id, valid, likesAttempt]);
  const message = (receiverId: number, withListing = false): void => {
    const to = routes.messageThread(receiverId) + (withListing ? `?listingId=${id}` : '');
    navigate(user.status === UserStatus.Logged ? to : getAuthenticationPath(routes.signIn, to));
  };
  if (!valid || data.detailStatus === AdvertDetailStatus.NotFound)
    return (
      <main className={styles.listing__page}>
        <h1>Объявление не найдено</h1>
        <Button onClick={() => navigate(routes.listings)}>К объявлениям</Button>
      </main>
    );
  if (data.detailStatus === AdvertDetailStatus.Error)
    return (
      <main className={styles.listing__page}>
        <Alert variant={AlertVariant.Error}>Не удалось загрузить объявление.</Alert>
        <Button onClick={() => setAttempt((value) => value + 1)}>Повторить</Button>
      </main>
    );
  const advert = data.chosenAdvert;
  if (!advert || advert.id !== id || data.detailStatus !== AdvertDetailStatus.Ready)
    return <Spinner label="Загрузка объявления" />;
  const authorId = advert.userId;

  return (
    <main className={styles.listing__page}>
      <ListingHeader
        title={advert.title || 'Объявление'}
        photos={
          advert.AdvertPhotos?.flatMap((photo) =>
            photo.photo
              ? [{ id: String(photo.id), src: photo.photo, alt: advert.title || 'Фото жилья' }]
              : [],
          ) ?? []
        }
        onBack={() => navigate(searchDestination(location.state))}
      />
      {saved.error && (
        <Alert variant={AlertVariant.Error}>
          {saved.error}
          <Button onClick={saved.reload}>Повторить загрузку избранного</Button>
        </Alert>
      )}
      {saved.errors[id] && <Alert variant={AlertVariant.Error}>{saved.errors[id]}</Alert>}
      <ListingDetails
        saved={saved.savedIds.includes(id)}
        saveDisabled={saved.disabled || !!saved.pending[id]}
        contactDisabled={!authorId || (user.status === UserStatus.Logged && user.id === authorId)}
        onContact={() => {
          if (authorId) message(authorId, true);
        }}
        onSavedChange={() => saved.toggle(advert)}
        information={{
          rooms: advert.rooms ?? undefined,
          floor: advert.floor ?? undefined,
          area: advert.square ?? undefined,
          description: advert.body || 'Описание не добавлено',
          tags: advert.tags?.map((tag) => tag.name) ?? [],
          location: {
            city: advert.location?.city ?? undefined,
            district: advert.location?.district ?? undefined,
            metro: advert.location?.metro ?? undefined,
            address: advert.location?.address ?? undefined,
          },
        }}
        contact={{
          price: advert.price,
          author: advert.user?.name || 'Автор',
          authorCity: advert.location?.city ?? undefined,
        }}
        map={
          advert.location?.coordinates ? (
            <YMap location={advert.location.coordinates} />
          ) : (
            <p>Координаты не указаны</p>
          )
        }
        interested={
          <>
            {likesLoading && <Spinner label="Загрузка заинтересованных" />}
            {!likesLoading && likesError && (
              <>
                <Alert variant={AlertVariant.Error}>Не удалось загрузить заинтересованных.</Alert>
                <Button onClick={() => setLikesAttempt((value) => value + 1)}>Повторить</Button>
              </>
            )}
            {!likesLoading && !likesError && (
              <div className={styles.listing__people}>
                {likes.advertId === id &&
                  likes.likes.map((like) => (
                    <PersonSummary
                      key={like.id}
                      name={like.User?.name || 'Пользователь'}
                      avatarUrl={getMediaUrl(like.User?.UserProfile?.photo)}
                      description={like.User?.UserProfile?.about ?? undefined}
                      action={
                        user.status === UserStatus.Logged && user.id === like.userId ? undefined : (
                          <Button onClick={() => message(like.userId)}>Написать</Button>
                        )
                      }
                    />
                  ))}
                {(likes.advertId !== id || likes.likes.length === 0) && (
                  <p>Пока никто не сохранил объявление</p>
                )}
              </div>
            )}
          </>
        }
      />
    </main>
  );
}
