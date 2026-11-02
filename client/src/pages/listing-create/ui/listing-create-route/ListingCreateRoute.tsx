import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@app/store/hooks';
import { postAdvertThunk } from '@features/create-advert/thunks';
import { geocodeAddress } from '@features/create-advert/model/geocode-address';
import { useTagCatalog } from '@entities/advert/model/use-tag-catalog';
import { routes } from '@shared/config/routes';
import { ListingCreatePage } from '../listing-create-page/ListingCreatePage';
import { publicationData } from './helper';
import styles from './ListingCreateRoute.module.scss';

export default function ListingCreateRoute(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const catalog = useTagCatalog();
  return (
    <div className={styles.publish__route}>
      <ListingCreatePage
        tagCatalog={catalog}
        onPublish={async (draft, photos) => {
          const coordinates = await geocodeAddress(draft.city, draft.address);
          const advert = await dispatch(
            postAdvertThunk(publicationData(draft, photos, coordinates)),
          ).unwrap();
          navigate(routes.listingDetails(advert.id), { replace: true });
        }}
      />
    </div>
  );
}
