export interface ListingDraft {
  title: string;
  city: string;
  metro: string;
  area: string;
  price: string;
  description: string;
  rules: string[];
}

export type ListingCreatePublishState = 'idle' | 'loading' | 'error' | 'success';
