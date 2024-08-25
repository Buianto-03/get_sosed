import { z } from 'zod';

export const likeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  advertId: z.number(),
  User: z.object({
    id: z.number(),
    name: z.string(),
    UserProfile: z.object({
      photo: z.string(),
      about: z.string(),
      age: z.number(),
    }),
  }),
});

export type LikeType = z.infer<typeof likeSchema>;

export type LikeSliceTtype = {
  likes: LikeType[];
  // isLiked: boolean;
};
