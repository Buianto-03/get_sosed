import { z } from 'zod';

export const participantSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  UserProfile: z.object({ photo: z.string().nullable() }).nullable().optional(),
});
export const chatSchema = z.object({
  id: z.number(),
  senderId: z.number(),
  receiverId: z.number(),
  message: z.string(),
  createdAt: z.string().optional(),
  sender: participantSchema.optional(),
  receiver: participantSchema.optional(),
});
export type ChatType = z.infer<typeof chatSchema>;
