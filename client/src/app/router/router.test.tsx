import { matchRoutes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RoutePattern } from '@shared/config/routes';
import { appRouteObjects } from './router';

function matchedLeaf(pathname: string): string | undefined {
  const matches = matchRoutes(appRouteObjects, pathname);
  return matches?.[matches.length - 1]?.route.path;
}

describe('application routes', () => {
  it('matches the static listing-create route before the dynamic listing detail route', () => {
    expect(matchedLeaf(RoutePattern.ListingCreate)).toBe(RoutePattern.ListingCreate);
    expect(matchedLeaf('/listings/42')).toBe('/listings/:listingId');
  });

  it('uses the canonical paths for migrated screens', () => {
    expect(matchedLeaf('/listings')).toBe(RoutePattern.Listings);
    expect(matchedLeaf('/profile')).toBe(RoutePattern.Profile);
    expect(matchedLeaf('/messages/7')).toBe('/messages/:receiverId');
    expect(matchedLeaf('/sign-in')).toBe(RoutePattern.SignIn);
    expect(matchedLeaf('/sign-up')).toBe(RoutePattern.SignUp);
  });

  it.each([
    '/home',
    '/advert/42',
    '/post',
    '/account',
    '/chat/7',
    '/signin',
    '/signup',
    '/arbitrary-path',
  ])('does not alias an old or unknown address: %s', (path) => {
    expect(matchedLeaf(path)).toBe('*');
  });
});
