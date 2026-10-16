import { routes } from '@shared/config/routes';

export type PreviewScreen =
  | 'home'
  | 'search'
  | 'detail'
  | 'about'
  | 'signin'
  | 'signup'
  | 'profile'
  | 'chat'
  | 'post';

// Stable sample IDs belong to preview navigation, never to the site header.
export const previewRoutes: Record<PreviewScreen, string> = {
  home: routes.home,
  search: routes.listings,
  detail: routes.listingDetails(1),
  about: routes.about,
  signin: routes.signIn,
  signup: routes.signUp,
  profile: routes.profile,
  chat: routes.messages,
  post: routes.listingCreate,
};
