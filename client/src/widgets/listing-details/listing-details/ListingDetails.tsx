/* eslint-disable @typescript-eslint/consistent-type-definitions */
import React from 'react';
import { ListingInformation, type ListingInformationData } from '../listing-information/ListingInformation';
import { ListingContactCard, type ListingContactData } from '../listing-contact-card/ListingContactCard';
import styles from './ListingDetails.module.scss';

interface ListingDetailsProps {
  information: ListingInformationData;
  contact: ListingContactData;
  saved: boolean;
  contactDisabled?: boolean;
  onContact: () => void;
  onSavedChange: (saved: boolean) => void;
}

export function ListingDetails({
  information,
  contact,
  saved,
  contactDisabled = false,
  onContact,
  onSavedChange,
}: ListingDetailsProps): JSX.Element {
  return (
    <div className={styles.listingDetails}>
      <div className={styles.listingDetails__grid}>
        <ListingInformation information={information} />
        <ListingContactCard
          contact={contact}
          saved={saved}
          contactDisabled={contactDisabled}
          onContact={onContact}
          onSavedChange={onSavedChange}
        />
      </div>
    </div>
  );
}
