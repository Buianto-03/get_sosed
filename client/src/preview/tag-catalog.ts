import { ListingCondition, TagCatalogState } from '@entities/advert/model/tag-catalog';
import type { TagCatalog } from '@entities/advert/model/tag-catalog';

// Demonstration IDs belong only to preview; production loads IDs from the API.
export const previewTagCatalog: TagCatalog = {
  tags: [
    { id: 101, name: ListingCondition.NonSmoking },
    { id: 205, name: ListingCondition.PetsAllowed },
    { id: 310, name: ListingCondition.QuietEvenings },
    { id: 419, name: ListingCondition.Workspace },
  ],
  state: TagCatalogState.Ready,
  error: null,
  reload: () => undefined,
};
