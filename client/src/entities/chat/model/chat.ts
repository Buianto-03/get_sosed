import { z } from 'zod';

export const chatSchema = z.object({
  id: z.number(),
  senderId: z.number(),
  receiverId: z.number(),
  message: z.string(),
});

export type ChatType = z.infer<typeof chatSchema>;