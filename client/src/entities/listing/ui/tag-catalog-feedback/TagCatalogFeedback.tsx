import React from 'react';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { TagCatalogState } from '../../model/tag-catalog';
import type { TagCatalog } from '../../model/tag-catalog';
import styles from './TagCatalogFeedback.module.scss';

export interface TagCatalogFeedbackProps {
  catalog: TagCatalog;
}

export function TagCatalogFeedback({ catalog }: TagCatalogFeedbackProps): JSX.Element | null {
  if (catalog.state === TagCatalogState.Loading) {
    return <p role="status">Загрузка условий проживания…</p>;
  }
  if (catalog.state !== TagCatalogState.Error) return null;

  return (
    <div className={styles.tag_catalog_feedback}>
      <Alert variant={AlertVariant.Error} title="Условия проживания недоступны">
        {catalog.error}
      </Alert>
      <Button variant={ButtonVariant.Secondary} onClick={catalog.reload}>
        Повторить загрузку условий
      </Button>
    </div>
  );
}
