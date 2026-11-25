import { z } from 'zod';
import { getMediaUrl } from '@shared/config/media';

export const photoSchema = z.object({
  id: z.number(),
  advertId: z.number().nullable(),
  photo: z.string().nullable().optional().transform((value) => getMediaUrl(value)),
  // createdAt: z.string(),
  // updatedAt: z.string(),
});

export type PhotoType = z.infer<typeof photoSchema>;
