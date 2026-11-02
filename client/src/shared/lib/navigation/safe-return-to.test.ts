import { describe, expect, it } from 'vitest';
import { routes } from '@shared/config/routes';
import {
  getAuthenticationPath,
  getPostAuthDestination,
  getSafeReturnTo,
} from './safe-return-to';

describe('safe auth return paths', () => {
  it('keeps the local pathname, query and hash', () => {
    const destination = '/listings/new?draft=1#photos';
    expect(getSafeReturnTo(destination)).toBe(destination);
  });

  it.each([
    'https://outside.example/path',
    '//outside.example/path',
    '/\\outside.example/path',
    '/sign-in',
    '/sign-up?returnTo=/profile',
    '/%73ign-in',
    '/broken%2',
  ])('rejects an unsafe or looping destination: %s', (destination) => {
    expect(getSafeReturnTo(destination)).toBeNull();
  });

  it('uses the profile as the fallback after authentication', () => {
    expect(getPostAuthDestination(null)).toBe(routes.profile);
    expect(getPostAuthDestination('https://outside.example')).toBe(routes.profile);
  });

  it('preserves a safe destination when switching between auth forms', () => {
    const returnTo = '/messages/7?listingId=12#composer';
    const signUpPath = getAuthenticationPath(routes.signUp, returnTo);
    const signInPath = getAuthenticationPath(routes.signIn, returnTo);

    expect(new URLSearchParams(signUpPath.split('?')[1]).get('returnTo')).toBe(returnTo);
    expect(new URLSearchParams(signInPath.split('?')[1]).get('returnTo')).toBe(returnTo);
  });

  it('does not carry an invalid return path into an auth form link', () => {
    expect(getAuthenticationPath(routes.signUp, '//outside.example')).toBe(routes.signUp);
  });
});
