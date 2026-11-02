import { describe, expect, it } from 'vitest';
import { RoutePattern, routes } from './routes';

describe('canonical browser route builders', () => {
  it('defines page paths as a string enum', () => {
    expect(RoutePattern.Home).toBe('/');
    expect(RoutePattern.ListingCreate).toBe('/listings/new');
  });

  it('builds detail and conversation paths from actual ids', () => {
    expect(routes.listingDetails(42)).toBe('/listings/42');
    expect(routes.messageThread('7')).toBe('/messages/7');
  });

  it.each([0, -1, 'not-an-id', '1/other'])('rejects an invalid route id: %s', (id) => {
    expect(() => routes.listingDetails(id)).toThrow();
    expect(() => routes.messageThread(id)).toThrow();
  });
});
