import React, { memo } from 'react';
import { getTagCatalogView, TagCatalogState, type TagCatalog } from '@entities/listing/model';
import { TagCatalogFeedback } from '@entities/listing/ui/tag-catalog-feedback/TagCatalogFeedback';
import { Checkbox } from '@shared/ui/selection/checkbox/Checkbox';
import styles from './ListingRules.module.scss';

interface ListingRulesProps {
  catalog: TagCatalog;
  tagIds: readonly number[];
  onChange: (id: number, checked: boolean) => void;
}

function ListingRulesView({ catalog, tagIds, onChange }: ListingRulesProps): JSX.Element {
  const { primary } = getTagCatalogView(catalog.tags);
  const selected = new Set(tagIds);

  return (
    <fieldset className={styles.listing_rules}>
      <legend>Условия проживания</legend>
      <TagCatalogFeedback catalog={catalog} />
      {primary.map((rule) => (
        <Checkbox
          key={rule.id}
          id={`listing-rule-${rule.id}`}
          label={rule.name}
          disabled={catalog.state !== TagCatalogState.Ready}
          checked={selected.has(rule.id)}
          onChange={(event) => onChange(rule.id, event.target.checked)}
        />
      ))}
    </fieldset>
  );
}

export const ListingRules = memo(ListingRulesView);
