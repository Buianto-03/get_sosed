import type { SignOptions } from 'jsonwebtoken';

const jwtConfig: Record<'access' | 'refresh', SignOptions> = {
  access: {
    expiresIn: `${5 * 1000}`,
  },
  refresh: {
    expiresIn: `${12 * 60 * 60 * 1000}`,
  },
};

export = jwtConfig;
