import React, { type ReactNode } from 'react';
import { ListingInformation, type ListingInformationData } from '../listing-information/ListingInformation';
import { ListingContactCard, type ListingContactData } from '../listing-contact-card/ListingContactCard';
import styles from './ListingDetails.module.scss';

interface ListingDetailsProps {
  information: ListingInformationData;
  contact: ListingContactData;
  saved: boolean;
  contactDisabled?: boolean;
  saveDisabled?: boolean;
  map?: ReactNode;
  interested?: ReactNode;
  onContact: () => void;
  onSavedChange: (saved: boolean) => void;
}

export function ListingDetails({
  information,
  contact,
  saved,
  contactDisabled = false,
  saveDisabled,
  map,
  interested,
  onContact,
  onSavedChange,
}: ListingDetailsProps): JSX.Element {
  return (
    <div className={styles.listingDetails}>
      <div className={styles.listingDetails__grid}>
        <ListingInformation information={information} map={map} interested={interested} />
        <ListingContactCard
          contact={contact}
          saved={saved}
          saveDisabled={saveDisabled}
          contactDisabled={contactDisabled}
          onContact={onContact}
          onSavedChange={onSavedChange}
        />
      </div>
    </div>
  );
}
