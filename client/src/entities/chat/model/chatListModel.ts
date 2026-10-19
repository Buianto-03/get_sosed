import type { z } from 'zod';
import { chatSchema, participantSchema, type ChatType } from './chat';

export const chatListSchema = chatSchema.extend({
  sender: participantSchema,
  receiver: participantSchema,
});
export const summarySchema = participantSchema;
export type ChatListType = z.infer<typeof chatListSchema>;
export type UserSummary = z.infer<typeof summarySchema>;
export enum ChatStatus {
  Idle = 'idle',
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}
export interface ChatListSlice {
  chatList: ChatListType[];
  online: { id: number; name: string }[];
  messagesByUser: Record<number, ChatType[]>;
  historyStatus: Record<number, ChatStatus>;
  status: ChatStatus;
  error: string | null;
  requestId: string | null;
  connected: boolean;
}
