import { describe, expect, it } from 'vitest';
import chatReducer, { addMessage, setMessages } from './chatListSlice';
import { incomingMessageSchema } from './protocol';

describe('chatListSlice', () => {
  it('keeps message history with the addressed dialog', () => {
    const event = incomingMessageSchema.parse({ type: 'SET_MESSAGES', receiverId: 2, payload: [] });
    expect(event.type).toBe('SET_MESSAGES');
    const message = { id: 10, senderId: 2, receiverId: 1, message: 'Привет' };
    const withHistory = chatReducer(undefined, setMessages({ receiverId: 2, messages: [message] }));
    const withReply = chatReducer(withHistory, addMessage({ userId: 2, message: { ...message, id: 11 } }));
    expect(withReply.messagesByUser[2]).toHaveLength(2);
    expect(withReply.messagesByUser[3]).toBeUndefined();
  });
});
