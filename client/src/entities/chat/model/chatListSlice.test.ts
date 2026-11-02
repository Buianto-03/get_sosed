import { describe, expect, it } from 'vitest';
import chatReducer, { addMessage, setMessages, clearChat } from './chatListSlice';
import { getReceiverListThunk } from './chatListThunk';
import { incomingMessageSchema } from './protocol';

describe('chatListSlice', () => {
  it('keeps message history with the addressed dialog', () => {
    const event = incomingMessageSchema.parse({ type: 'SET_MESSAGES', receiverId: 2, payload: [] });
    expect(event.type).toBe('SET_MESSAGES');
    const message = { id: 10, senderId: 2, receiverId: 1, message: 'Привет' };
    const withHistory = chatReducer(undefined, setMessages({ receiverId: 2, messages: [message] }));
    const withReply = chatReducer(
      withHistory,
      addMessage({ userId: 2, message: { ...message, id: 11 } }),
    );
    expect(withReply.messagesByUser[2]).toHaveLength(2);
    expect(withReply.messagesByUser[3]).toBeUndefined();
  });
});

it('merges history with a newer live message and deduplicates replayed events', () => {
  const message = { id: 11, senderId: 2, receiverId: 1, message: 'Новое' };
  let state = chatReducer(undefined, addMessage({ userId: 2, message }));
  state = chatReducer(state, setMessages({ receiverId: 2, messages: [{ ...message, id: 10 }] }));
  state = chatReducer(state, addMessage({ userId: 2, message }));
  expect(state.messagesByUser[2].map((item) => item.id)).toEqual([10, 11]);
});
it('ignores a late conversation list after the session is cleared', () => {
  let state = chatReducer(undefined, getReceiverListThunk.pending('old', 1));
  state = chatReducer(state, clearChat());
  state = chatReducer(state, getReceiverListThunk.fulfilled([], 'old', 1));
  expect(state.requestId).toBeNull();
  expect(state.status).toBe('idle');
});
