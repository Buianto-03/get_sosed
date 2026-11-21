import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainBanner } from '@widgets/main-banner/MainBanner';
import { FreshListings, FreshListingsState } from '@widgets/fresh-listings/FreshListings';
import { HowItWorks } from '@widgets/how-it-works/HowItWorks';
import { useSavedCollectionStatus } from '@features/liked-adverts/model/use-saved-collection-status';
import { SavedListingCard } from '@features/liked-adverts/ui/saved-listing-card/SavedListingCard';
import advertService from '@entities/advert/api/advertService';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { ListingCardVariant } from '@entities/listing/ui/listing-card/ListingCard';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { routes } from '@shared/config/routes';
import { freshestAdverts, toHomeCard } from './helper';
import styles from './HomeRoute.module.scss';

export default function HomeRoute(): JSX.Element {
  const navigate = useNavigate();
  const { status: savedStatus, reload: reloadSaved } = useSavedCollectionStatus();
  const [adverts, setAdverts] = useState<AdvertType[]>([]);
  const [state, setState] = useState(FreshListingsState.Loading);
  const [attempt, setAttempt] = useState(0);
  const openListing = useCallback((id: string) => navigate(routes.listingDetails(id)), [navigate]);

  useEffect(() => {
    let active = true;
    setState(FreshListingsState.Loading);
    void advertService
      .getAdverts()
      .then((items) => {
        if (!active) {
          return;
        }
        setAdverts(freshestAdverts(items));
        setState(FreshListingsState.Ready);
      })
      .catch(() => {
        if (active) {
          setState(FreshListingsState.Error);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <main className={styles.home__page}>
      <MainBanner onFindHousing={() => navigate(routes.listings)} />
      {savedStatus === SavedStatus.Error && (
        <div>
          <Alert variant={AlertVariant.Error}>Не удалось загрузить избранное.</Alert>
          <Button variant={ButtonVariant.Secondary} onClick={reloadSaved}>
            Повторить загрузку избранного
          </Button>
        </div>
      )}
      <FreshListings
        state={state}
        cards={adverts.map((advert) => (
          <SavedListingCard
            key={advert.id}
            advert={advert}
            toListing={toHomeCard}
            variant={ListingCardVariant.Home}
            onOpen={openListing}
          />
        ))}
        onRetry={() => setAttempt((current) => current + 1)}
        onViewAllListings={() => navigate(routes.listings)}
      />
      <HowItWorks />
    </main>
  );
}
