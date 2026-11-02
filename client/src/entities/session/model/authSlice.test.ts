import { describe, expect, it } from 'vitest';
import authReducer, { clearAuth, setSession } from './authSlice';
import { UserStatus } from './authModel';

describe('authSlice', () => {
  it('accepts login and clears the user on logout', () => {
    const user = { id: 1, name: 'Test', email: 'test@example.com', roleId: 1 };
    const logged = authReducer(undefined, setSession({ accessToken: 'token', user }));
    expect(logged.user.status).toBe(UserStatus.Logged);
    expect(logged.accessToken).toBe('token');

    const guest = authReducer(logged, clearAuth());
    expect(guest.user.status).toBe(UserStatus.Guest);
    expect(guest.accessToken).toBe('');
  });
});
