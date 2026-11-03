import type { Response } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  name?: string | null;
}

export interface AuthPayload extends JwtPayload {
  user: AuthUser;
}

export interface AuthLocals {
  user: AuthUser;
}

export type AuthResponse = Response<unknown, AuthLocals>;
