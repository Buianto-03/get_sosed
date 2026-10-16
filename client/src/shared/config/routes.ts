const positiveId = (value: string | number, label: string): string => {
  const id = String(value);
  if (!/^[1-9]\d*$/.test(id)) {
    throw new Error(`${label} must be a positive integer`);
  }
  return encodeURIComponent(id);
};

export enum RoutePattern {
  Home = '/',
  Listings = '/listings',
  ListingCreate = '/listings/new',
  About = '/about',
  SignIn = '/sign-in',
  SignUp = '/sign-up',
  Profile = '/profile',
  ProfileEdit = '/profile/edit',
  Messages = '/messages',
}

export const routes = {
  home: RoutePattern.Home,
  listings: RoutePattern.Listings,
  listingDetails: (listingId: string | number): string =>
    `/listings/${positiveId(listingId, 'listingId')}`,
  listingCreate: RoutePattern.ListingCreate,
  about: RoutePattern.About,
  signIn: RoutePattern.SignIn,
  signUp: RoutePattern.SignUp,
  profile: RoutePattern.Profile,
  profileEdit: RoutePattern.ProfileEdit,
  messages: RoutePattern.Messages,
  messageThread: (receiverId: string | number): string =>
    `/messages/${positiveId(receiverId, 'receiverId')}`,
} as const;
