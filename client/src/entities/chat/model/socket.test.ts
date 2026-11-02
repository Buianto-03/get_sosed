import { afterEach, expect, it, vi } from 'vitest';
import { chatSocket } from './socket';

class FakeSocket {
  static OPEN = 1;

  static instances: FakeSocket[] = [];

  readyState = 1;

  onopen?: () => void;

  onclose?: () => void;

  onmessage?: (event: { data: string }) => void;

  send = vi.fn();

  close = vi.fn();

  constructor() { FakeSocket.instances.push(this); }
}

afterEach(() => {
  chatSocket.disconnect();
  vi.unstubAllGlobals();
  FakeSocket.instances = [];
});
it('never forwards an old socket event to the listener of a new session', () => {
  vi.stubGlobal('WebSocket', FakeSocket);
  const first = vi.fn(); const second = vi.fn();
  chatSocket.connect(first);
  const old = FakeSocket.instances[0];
  chatSocket.connect(second);
  const event = { data: JSON.stringify({ type: 'ADD_MESSAGE', payload: { id: 1, senderId: 2, receiverId: 3, message: 'Текст' } }) };
  old.onmessage?.(event);
  expect(second).not.toHaveBeenCalled();
  FakeSocket.instances[1].onmessage?.(event);
  expect(second).toHaveBeenCalledTimes(1);
});
it('returns false when a transport write throws, so the composer can retain its text', () => {
  vi.stubGlobal('WebSocket', FakeSocket);
  chatSocket.connect(vi.fn());
  FakeSocket.instances[0].send.mockImplementationOnce(() => { throw new Error('socket closed'); });
  expect(chatSocket.sendMessage(2, 'Текст')).toBe(false);
  expect(chatSocket.sendMessage(2, 'Текст')).toBe(true);
});
