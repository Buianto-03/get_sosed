import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainBanner } from '@widgets/main-banner/MainBanner';
import { FreshListings, FreshListingsState } from '@widgets/fresh-listings/FreshListings';
import { HowItWorks } from '@widgets/how-it-works/HowItWorks';
import { useSavedAdverts } from '@features/liked-adverts/model/use-saved-adverts';
import advertService from '@entities/advert/api/advertService';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { routes } from '@shared/config/routes';
import { freshestAdverts, toHomeCard } from './helper';
import styles from './HomeRoute.module.scss';

export default function HomeRoute(): JSX.Element {
  const navigate = useNavigate();
  const saved = useSavedAdverts();
  const [adverts, setAdverts] = useState<AdvertType[]>([]);
  const [state, setState] = useState(FreshListingsState.Loading);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState(FreshListingsState.Loading);
    void advertService
      .getAdverts()
      .then((items) => {
        if (!active) return;
        setAdverts(freshestAdverts(items));
        setState(FreshListingsState.Ready);
      })
      .catch(() => {
        if (active) setState(FreshListingsState.Error);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <main className={styles.home__page}>
      <MainBanner onFindHousing={() => navigate(routes.listings)} />
      {saved.status === SavedStatus.Error && (
        <div>
          <Alert variant={AlertVariant.Error}>Не удалось загрузить избранное.</Alert>
          <Button variant={ButtonVariant.Secondary} onClick={saved.reload}>
            Повторить загрузку избранного
          </Button>
        </div>
      )}
      <FreshListings
        state={state}
        listings={adverts.map((advert) => ({
          id: String(advert.id),
          listing: toHomeCard(advert),
          saved: saved.savedIds.includes(advert.id),
          saveDisabled: saved.disabled || !!saved.pending[advert.id],
          saveError: saved.errors[advert.id],
        }))}
        onRetry={() => setAttempt((current) => current + 1)}
        onOpenListing={(id) => navigate(routes.listingDetails(id))}
        onSaveListing={(id) => {
          const advert = adverts.find((item) => String(item.id) === id);
          if (advert) saved.toggle(advert);
        }}
        onViewAllListings={() => navigate(routes.listings)}
      />
      <HowItWorks />
    </main>
  );
}
