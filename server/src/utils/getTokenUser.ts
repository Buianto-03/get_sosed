import type { AuthUser } from '../types/auth';

function isAuthUser(user: unknown): user is AuthUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    !Array.isArray(user) &&
    'id' in user &&
    typeof user.id === 'number' &&
    Number.isSafeInteger(user.id) &&
    user.id > 0 &&
    (!('name' in user) || user.name === null || typeof user.name === 'string')
  );
}

function getTokenUser(payload: unknown): AuthUser {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('user' in payload) ||
    !isAuthUser(payload.user)
  ) {
    throw new Error('Invalid token user');
  }
  return payload.user;
}

export = getTokenUser;
