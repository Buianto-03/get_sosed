import { z } from 'zod';
import { chatSchema } from './chat';

export const incomingMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CHAT_ERROR'), receiverId: z.number(), payload: z.string() }),
  z.object({ type: z.literal('SET_USERS'), payload: z.array(z.object({ id: z.number(), name: z.string() })) }),
  z.object({ type: z.literal('SET_MESSAGES'), receiverId: z.number(), payload: z.array(chatSchema) }),
  z.object({ type: z.literal('ADD_MESSAGE'), payload: chatSchema }),
  z.object({ type: z.literal('NEW_MESSAGE'), payload: chatSchema }),
]);

export type IncomingMessage = z.infer<typeof incomingMessageSchema>;

export type OutgoingMessage =
  | { type: 'INITIALIZE'; payload: { receiverId: number } }
  | { type: 'ADD_MESSAGE'; payload: { text: string; receiverId: number } };
