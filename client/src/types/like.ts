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

export type LikeType = z.infer<typeof likeSchema>;

export type LikeSliceTtype = {
  likes: LikeType[];
  // isLiked: boolean;
};
