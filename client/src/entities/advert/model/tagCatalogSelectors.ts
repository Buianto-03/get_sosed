import { emptyTagCatalogEntry, TAG_CATALOG_TTL_MS } from './tagCatalogModel';
import type { TagCatalogEntry, TagCatalogRoot } from './tagCatalogModel';
import { TagCatalogState } from './tag-catalog';

export const selectTagCatalogEntry = (state: TagCatalogRoot, origin: string): TagCatalogEntry =>
  state.tagCatalog.entries[origin] ?? emptyTagCatalogEntry;

export function isTagCatalogFresh(entry: TagCatalogEntry, now: number): boolean {
  return (
    !entry.invalidated &&
    entry.state === TagCatalogState.Ready &&
    entry.fetchedAt !== null &&
    now >= entry.fetchedAt &&
    now - entry.fetchedAt < TAG_CATALOG_TTL_MS
  );
}
