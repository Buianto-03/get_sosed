import type { TagType } from './advertsModel';

export enum ListingCondition {
  NonSmoking = 'Для некурящих',
  PetsAllowed = 'Питомцы разрешены',
  QuietEvenings = 'Тихие вечера',
  Workspace = 'С рабочим местом',
}

export enum TagCatalogState {
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}

export interface TagCatalog {
  tags: readonly TagType[];
  state: TagCatalogState;
  error: string | null;
  reload: () => void;
}

interface TagCatalogView {
  primary: readonly TagType[];
  additional: readonly TagType[];
  byId: ReadonlyMap<number, TagType>;
  labels: ReadonlyMap<number, string>;
  error: string | null;
}

const conditionNames: readonly string[] = Object.values(ListingCondition);
const catalogViews = new WeakMap<readonly TagType[], TagCatalogView>();

function buildTagCatalogView(tags: readonly TagType[]): TagCatalogView {
  const byId = new Map<number, TagType>();
  const byName = new Map<string, { count: number; lowestIdTag: TagType }>();
  let hasDuplicateIds = false;

  tags.forEach((tag) => {
    if (byId.has(tag.id)) {
      hasDuplicateIds = true;
    } else {
      byId.set(tag.id, tag);
    }
    const group = byName.get(tag.name);
    if (!group) {
      byName.set(tag.name, { count: 1, lowestIdTag: tag });
    } else {
      group.count += 1;
      if (tag.id < group.lowestIdTag.id) {
        group.lowestIdTag = tag;
      }
    }
  });

  const primary: TagType[] = [];
  const primaryIds = new Set<number>();
  const missing: string[] = [];
  conditionNames.forEach((name) => {
    const tag = byName.get(name)?.lowestIdTag;
    if (!tag) {
      missing.push(name);
    } else if (!primaryIds.has(tag.id)) {
      primary.push(tag);
      primaryIds.add(tag.id);
    }
  });

  const additional: TagType[] = [];
  const labels = new Map<number, string>();
  byId.forEach((tag, id) => {
    if (!primaryIds.has(id)) {
      additional.push(tag);
    }
    const count = byName.get(tag.name)?.count ?? 0;
    labels.set(id, count > 1 ? `${tag.name} (#${id})` : tag.name);
  });

  let error = null;
  if (missing.length > 0) {
    error = `В каталоге отсутствуют условия: ${missing.join(', ')}.`;
  } else if (hasDuplicateIds) {
    error = 'В каталоге повторяются ID условий.';
  }
  return { primary, additional, byId, labels, error };
}

export function getTagCatalogView(tags: readonly TagType[]): TagCatalogView {
  let view = catalogViews.get(tags);
  if (!view) {
    view = buildTagCatalogView(tags);
    catalogViews.set(tags, view);
  }
  return view;
}

export function getTagLabel(view: TagCatalogView, id: number): string {
  return view.labels.get(id) ?? `#${id}`;
}
