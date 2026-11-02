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
  tags: TagType[];
  state: TagCatalogState;
  error: string | null;
  reload: () => void;
}

const conditionNames: string[] = Object.values(ListingCondition);

export function getPrimaryTags(tags: TagType[]): TagType[] {
  return conditionNames.flatMap((name) => {
    const tag = tags.filter((item) => item.name === name).sort((a, b) => a.id - b.id)[0];
    return tag ? [tag] : [];
  });
}

export function getTagCatalogError(tags: TagType[]): string | null {
  const missing = conditionNames.filter((name) => !tags.some((tag) => tag.name === name));
  if (missing.length > 0) return `В каталоге отсутствуют условия: ${missing.join(', ')}.`;

  return new Set(tags.map((tag) => tag.id)).size !== tags.length
    ? 'В каталоге повторяются ID условий.'
    : null;
}

export function getTagLabel(tags: TagType[], id: number): string {
  const tag = tags.find((item) => item.id === id);
  if (!tag) return `#${id}`;
  return tags.filter((item) => item.name === tag.name).length > 1
    ? `${tag.name} (#${id})`
    : tag.name;
}
