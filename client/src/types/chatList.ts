import { z } from 'zod';

export const chatListSchema = z.object({
  id: z.number(),
  senderId: z.number(),
  receiverId: z.number(),
  message: z.string(),
  receiver: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  sender: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
});

export type ChatListType = z.infer<typeof chatListSchema>;

export type ChatListSlice = {
  chatList: ChatListType[];
}
