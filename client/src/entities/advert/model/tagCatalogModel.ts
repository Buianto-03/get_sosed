import { API_URL } from '@shared/config/env';
import type { TagType } from './advertsModel';
import { TagCatalogState } from './tag-catalog';

export const TAG_CATALOG_TTL_MS = 5 * 60 * 1000;

export interface TagCatalogEntry {
  tags: TagType[];
  state: TagCatalogState;
  error: string | null;
  requestId: string | null;
  fetchedAt: number | null;
  invalidated: boolean;
}

export interface TagCatalogCacheState {
  entries: Record<string, TagCatalogEntry | undefined>;
}

export interface TagCatalogRoot {
  tagCatalog: TagCatalogCacheState;
}

export interface TagCatalogRequest {
  origin: string;
  force?: boolean;
}

export interface TagCatalogSuccess {
  tags: TagType[];
  fetchedAt: number;
}

export const emptyTagCatalogEntry: TagCatalogEntry = {
  tags: [],
  state: TagCatalogState.Loading,
  error: null,
  requestId: null,
  fetchedAt: null,
  invalidated: true,
};

export function getTagCatalogOrigin(): string {
  const base = typeof window === 'undefined' ? 'http://localhost:3000' : window.location.href;
  return new URL(API_URL, base).origin;
}
