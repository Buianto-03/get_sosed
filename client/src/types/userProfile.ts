import { z } from 'zod';

export const userProfile = z.object({
  id: z.number().nullable(),
  age: z.number().optional().nullable(),
  about: z.string().optional(),
  photo: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export type UserProfileT = z.infer<typeof userProfile>;
