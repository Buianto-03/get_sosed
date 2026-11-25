import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainBanner } from '@widgets/main-banner/MainBanner';
import { FreshListings, FreshListingsState } from '@widgets/fresh-listings/FreshListings';
import { HowItWorks } from '@widgets/how-it-works/HowItWorks';
import { useSavedCollectionStatus } from '@features/liked-listings/model/use-saved-collection-status';
import { ListingCardWithSave } from '@features/liked-listings/ui/listing-card-with-save/ListingCardWithSave';
import { listingService } from '@entities/listing/api/listingService';
import { type Listing, SavedStatus } from '@entities/listing/model';
import { ListingCardVariant } from '@entities/listing/ui/listing-card/ListingCard';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { routes } from '@shared/config/routes';
import { isRequestCanceled } from '@shared/api/cancellation';
import { toHomeCard } from './helper';
import styles from './HomeRoute.module.scss';

export default function HomeRoute(): JSX.Element {
  const navigate = useNavigate();
  const { status: savedStatus, reload: reloadSaved } = useSavedCollectionStatus();
  const [listings, setListings] = useState<Listing[]>([]);
  const [state, setState] = useState(FreshListingsState.Loading);
  const [attempt, setAttempt] = useState(0);
  const openListing = useCallback((id: string) => navigate(routes.listingDetails(id)), [navigate]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState(FreshListingsState.Loading);
    void listingService
      .getFreshListings(3, { signal: controller.signal })
      .then((items) => {
        if (!active) {
          return;
        }
        setListings(items);
        setState(FreshListingsState.Ready);
      })
      .catch((error: unknown) => {
        if (active) {
          setState(isRequestCanceled(error) ? FreshListingsState.Ready : FreshListingsState.Error);
        }
      });
    return () => {
      active = false;
      controller.abort();
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
        cards={listings.map((listing) => (
          <ListingCardWithSave
            key={listing.id}
            listing={listing}
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
