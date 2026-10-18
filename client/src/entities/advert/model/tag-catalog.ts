import type { TagType } from './advert';

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
    const tag = tags.find((item) => item.name === name);
    return tag ? [tag] : [];
  });
}

export function getTagCatalogError(tags: TagType[]): string | null {
  const missing = conditionNames.filter((name) => (
    !tags.some((tag) => tag.name === name)
  ));
  if (missing.length > 0) return `В каталоге отсутствуют условия: ${missing.join(', ')}.`;

  const duplicated = conditionNames.filter((name) => (
    tags.filter((tag) => tag.name === name).length > 1
  ));
  return duplicated.length > 0
    ? `В каталоге повторяются условия: ${duplicated.join(', ')}.`
    : null;
}
