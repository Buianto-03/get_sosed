import { routes } from '@shared/config/routes';
import { getSafeReturnTo } from '@shared/lib/navigation/safe-return-to';

export function searchDestination(state: unknown): string {
  if (
    !state ||
    typeof state !== 'object' ||
    !('searchReturnTo' in state) ||
    typeof state.searchReturnTo !== 'string'
  )
    return routes.listings;
  const safe = getSafeReturnTo(state.searchReturnTo);
  return safe && new URL(safe, 'https://local.invalid').pathname === String(routes.listings)
    ? safe
    : routes.listings;
}
