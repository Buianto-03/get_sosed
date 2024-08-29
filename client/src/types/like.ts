import { z } from 'zod';
import { advertSchema } from './advert';

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
  Advert: advertSchema.optional()
});

export type LikeType = z.infer<typeof likeSchema>;

export type LikeSliceTtype = {
  likes: LikeType[];
  selectedLike: LikeType | null;
  // isLiked: boolean;
};

export const likedAdvertsSchema = z.object({
  id: z.number(),
  advertId: z.number(),
  userId: z.number(),
  Advert: advertSchema,
});

export type LikedAdvertsType = z.infer<typeof likedAdvertsSchema>;
