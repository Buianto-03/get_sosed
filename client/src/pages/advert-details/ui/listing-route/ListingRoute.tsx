import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { ListingHeader } from '@widgets/listing-header/ListingHeader';
import { ListingDetails } from '@widgets/listing-details/listing-details/ListingDetails';
import { PersonSummary } from '@entities/person/ui/PersonSummary';
import {
  getListingByIdThunk,
  ListingDetailStatus,
  selectListingState,
} from '@entities/listing/model';
import { UserStatus } from '@entities/session/model/authModel';
import { useSavedAdvert } from '@features/liked-adverts/model/use-saved-advert';
import { useSavedCollectionStatus } from '@features/liked-adverts/model/use-saved-collection-status';
import { Button } from '@shared/ui/button/Button';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Spinner } from '@shared/ui/feedback/Spinner';
import { YMap } from '@shared/ui/y-map/YMap';
import { getMediaUrl } from '@shared/config/media';
import { routes } from '@shared/config/routes';
import { getAuthenticationPath } from '@shared/lib/navigation/safe-return-to';
import { searchDestination, toListingDetails } from './helper';
import { useInterestedPeople } from './use-interested-people';
import styles from './ListingRoute.module.scss';

export default function ListingRoute(): JSX.Element {
  const { listingId } = useParams();
  const id = Number(listingId);
  const valid = !!listingId && /^[1-9]\d*$/.test(listingId) && Number.isSafeInteger(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const data = useAppSelector(selectListingState);
  const user = useAppSelector((state) => state.auth.user);
  const saved = useSavedAdvert(id);
  const savedCollection = useSavedCollectionStatus();
  const [attempt, setAttempt] = useState(0);
  const ownerId = user.status === UserStatus.Logged ? user.id : null;
  const interested = useInterestedPeople(valid ? id : null, ownerId);
  useEffect(() => {
    if (!valid) {
      return undefined;
    }
    const request = dispatch(getListingByIdThunk(id));
    return () => request.abort();
  }, [dispatch, id, valid, attempt]);
  const message = (receiverId: number, withListing = false): void => {
    const to = routes.messageThread(receiverId) + (withListing ? `?listingId=${id}` : '');
    navigate(user.status === UserStatus.Logged ? to : getAuthenticationPath(routes.signIn, to));
  };
  if (!valid || data.detailStatus === ListingDetailStatus.NotFound) {
    return (
      <main className={styles.listing__page}>
        <h1>Объявление не найдено</h1>
        <Button onClick={() => navigate(routes.listings)}>К объявлениям</Button>
      </main>
    );
  }
  if (data.detailStatus === ListingDetailStatus.Error) {
    return (
      <main className={styles.listing__page}>
        <Alert variant={AlertVariant.Error}>Не удалось загрузить объявление.</Alert>
        <Button onClick={() => setAttempt((value) => value + 1)}>Повторить</Button>
      </main>
    );
  }
  const advert = data.chosenListing;
  if (!advert || advert.id !== id || data.detailStatus !== ListingDetailStatus.Ready) {
    return <Spinner label="Загрузка объявления" />;
  }
  const authorId = advert.userId;
  const details = toListingDetails(advert);

  return (
    <main className={styles.listing__page}>
      <ListingHeader
        title={details.title}
        photos={details.photos}
        onBack={() => navigate(searchDestination(location.state))}
      />
      {savedCollection.error && (
        <Alert variant={AlertVariant.Error}>
          {savedCollection.error}
          <Button onClick={savedCollection.reload}>Повторить загрузку избранного</Button>
        </Alert>
      )}
      {saved.error && <Alert variant={AlertVariant.Error}>{saved.error}</Alert>}
      <ListingDetails
        saved={saved.saved}
        saveDisabled={saved.disabled}
        contactDisabled={!authorId || (user.status === UserStatus.Logged && user.id === authorId)}
        onContact={() => {
          if (authorId) {
            message(authorId, true);
          }
        }}
        onSavedChange={() => saved.toggle(advert)}
        information={details.information}
        contact={details.contact}
        map={
          advert.location?.coordinates ? (
            <YMap location={advert.location.coordinates} />
          ) : (
            <p>Координаты не указаны</p>
          )
        }
        interested={
          <>
            {interested.loading && <Spinner label="Загрузка заинтересованных" />}
            {interested.error && (
              <>
                <Alert variant={AlertVariant.Error}>Не удалось загрузить заинтересованных.</Alert>
                <Button onClick={interested.retry}>Повторить</Button>
              </>
            )}
            {!interested.loading && !interested.error && (
              <div className={styles.listing__people}>
                {interested.people.map((like) => (
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
                {interested.people.length === 0 && <p>Пока никто не сохранил объявление</p>}
              </div>
            )}
          </>
        }
      />
    </main>
  );
}
