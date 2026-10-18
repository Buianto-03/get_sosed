import { routes } from '@shared/config/routes';
import type { RoutePattern } from '@shared/config/routes';

const authenticationPaths = new Set([routes.signIn.toLowerCase(), routes.signUp.toLowerCase()]);
const returnToOrigin = 'https://get-sosed.invalid';

export function getSafeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }

  let destination: URL;
  try {
    destination = new URL(value, returnToOrigin);
  } catch {
    return null;
  }

  if (destination.origin !== returnToOrigin) return null;

  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(destination.pathname);
  } catch {
    return null;
  }

  const normalizedPathname = decodedPathname.replace(/\/+$/, '').toLowerCase() || '/';
  if (authenticationPaths.has(normalizedPathname)) return null;

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function getPostAuthDestination(returnTo: string | null): string {
  return getSafeReturnTo(returnTo) ?? routes.profile;
}

export function getAuthenticationPath(
  destination: RoutePattern.SignIn | RoutePattern.SignUp,
  returnTo: string | null,
): string {
  const safeReturnTo = getSafeReturnTo(returnTo);
  if (!safeReturnTo) return destination;

  const search = new URLSearchParams({ returnTo: safeReturnTo });
  return `${destination}?${search.toString()}`;
}
