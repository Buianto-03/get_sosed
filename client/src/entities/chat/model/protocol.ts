import { z } from 'zod';
import { chatSchema } from './chat';

export interface HistoryPageRequest {
  requestId: string;
  receiverId: number;
  limit: number;
  beforeId?: number;
  afterId?: number;
}

const id = z.number().int().positive();
const historyPageSchema = z.object({
  type: z.literal('HISTORY_PAGE'),
  requestId: z.string(),
  receiverId: id,
  payload: z.array(chatSchema),
  hasMore: z.boolean(),
  nextCursor: id.nullable(),
});

export const historyPageEnvelope = historyPageSchema.pick({
  type: true,
  requestId: true,
  receiverId: true,
});

export type HistoryPage = z.infer<typeof historyPageSchema>;

export const incomingMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('CHAT_ERROR'),
    requestId: z.string().optional(),
    receiverId: z.number(),
    payload: z.string(),
  }),
  z.object({
    type: z.literal('SET_USERS'),
    payload: z.array(z.object({ id: z.number(), name: z.string() })),
  }),
  historyPageSchema,
  z.object({ type: z.literal('ADD_MESSAGE'), payload: chatSchema }),
  z.object({ type: z.literal('NEW_MESSAGE'), payload: chatSchema }),
]);

export type IncomingMessage = z.infer<typeof incomingMessageSchema>;

export type OutgoingMessage =
  | { type: 'GET_HISTORY_PAGE'; payload: HistoryPageRequest }
  | { type: 'ADD_MESSAGE'; payload: { text: string; receiverId: number } };
