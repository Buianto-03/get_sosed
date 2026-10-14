import { z } from 'zod';

export const photoSchema = z.object({
  id: z.number(),
  advertId: z.number(),
  photo: z.string(),
  // createdAt: z.string(),
  // updatedAt: z.string(),
});

export type PhotoType = z.infer<typeof photoSchema>;
