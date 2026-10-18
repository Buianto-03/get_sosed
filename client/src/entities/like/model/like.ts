import { z } from 'zod';

export const likeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  advertId: z.number(),
  User: z
    .object({
      id: z.number(),
      name: z.string(),
      UserProfile: z.object({
        photo: z.string().nullable(),
        about: z.string().nullable(),
        age: z.number().nullable(),
      }),
    })
    .optional(),
});

export const deleteLikeSchema = z.object({
  advertId: z.number().int().positive(),
  deleted: z.boolean(),
});

export type DeleteLikeResult = z.infer<typeof deleteLikeSchema>;

export type LikeType = z.infer<typeof likeSchema>;

export type LikeSliceType = {
  likes: LikeType[];
  requests: Record<string, boolean>;
  readRequestId: string | null;
  advertId: number | null;
  userId: number | null;
};
