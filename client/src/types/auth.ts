import { z } from 'zod';

export const userPorfileSchema = z.object({
  about: z.string().nullable(),
  age: z.number().nullable(),
  gender: z.string().nullable(),
  photo: z.string().nullable(),
  phoneNumber: z.string().nullable(),
});

export const userPhotoSchema = z.object({
  id: z.number(),
  photo: z.string(),
  userId: z.number(),
});

export const userSchema = z.object({
  name: z.string(),
  email: z.string(),
  id: z.number(),
  roleId: z.number(),
  UserProfile: userPorfileSchema.optional(),
  UserPhotos: userPhotoSchema.array().optional(),
});

export type BackendUserT = z.infer<typeof userSchema>;

export type LoginForm = {
  email: string;
  password: string;
};

export enum UserStatus {
  Pending = 'pending',
  Guest = 'guest',
  Logged = 'logged',
}

export type UserT =
  | { status: UserStatus.Pending }
  | { status: UserStatus.Guest }
  | ({ status: UserStatus.Logged } & BackendUserT);

export const authSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
});

export type AuthSchemaT = z.infer<typeof authSchema>;

export type AuthState = {
  accessToken: string;
  user: UserT;
  // userProfile: BackendUserT['UserProfile']
};

export const signUpSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
  gender: z.string(),
});

export type SignUpSchemaT = z.infer<typeof signUpSchema>;
