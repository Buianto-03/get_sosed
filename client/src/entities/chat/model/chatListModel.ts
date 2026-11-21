import type { z } from 'zod';
import type { HistoryPageRequest } from './protocol';
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
export interface DialogAddress {
  ownerId: number;
  receiverId: number;
}

export interface DialogHistory extends DialogAddress {
  messages: ChatType[];
  sendFailed: boolean;
  initialized: boolean;
  beforeCursor: number | null;
  // Keep the confirmed recovery boundary independent of concurrent live messages.
  afterCursor: number | null;
  pending: HistoryPageRequest | null;
  failed: HistoryPageRequest | null;
  lastPageId: string | null;
  lastOlderPageId: string | null;
}

export interface ChatListSlice {
  chatList: ChatListType[];
  online: { id: number; name: string }[];
  history: DialogHistory | null;
  status: ChatStatus;
  error: string | null;
  requestId: string | null;
  connected: boolean;
}
