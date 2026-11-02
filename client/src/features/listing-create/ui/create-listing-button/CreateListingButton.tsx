import React from 'react';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { routes } from '@shared/config/routes';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import styles from './CreateListingButton.module.scss';

interface CreateListingButtonProps {
  variant?: ButtonVariant;
  className?: string;
  withIcon?: boolean;
}

export function CreateListingButton({
  variant = ButtonVariant.Primary,
  className,
  withIcon = false,
}: CreateListingButtonProps): JSX.Element {
  const navigate = useNavigate();

  const handleClick = (): void => navigate(routes.listingCreate);

  return (
    <Button variant={variant} className={className} onClick={handleClick}>
      {withIcon && <LuPlus className={styles.create_listing_button__icon} aria-hidden="true" />}
      Разместить объявление
    </Button>
  );
}
