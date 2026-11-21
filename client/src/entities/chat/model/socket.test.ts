import { afterEach, expect, it, vi } from 'vitest';
import { chatSocket } from './socket';

class FakeSocket {
  static OPEN = 1;

  static instances: FakeSocket[] = [];

  readyState = 1;

  onopen?: () => void;

  onclose?: () => void;

  onmessage?: (event: { data: string }) => void;

  send = vi.fn<[string], void>();

  close = vi.fn();

  constructor() {
    FakeSocket.instances.push(this);
  }
}

afterEach(() => {
  chatSocket.disconnect();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  FakeSocket.instances = [];
});
it('never forwards an old socket event to the listener of a new session', () => {
  vi.stubGlobal('WebSocket', FakeSocket);
  const first = vi.fn();
  const second = vi.fn();
  chatSocket.connect(first);
  const old = FakeSocket.instances[0];
  chatSocket.connect(second);
  const event = {
    data: JSON.stringify({
      type: 'ADD_MESSAGE',
      payload: { id: 1, senderId: 2, receiverId: 3, message: 'Текст' },
    }),
  };
  old.onmessage?.(event);
  expect(second).not.toHaveBeenCalled();
  FakeSocket.instances[1].onmessage?.(event);
  expect(second).toHaveBeenCalledTimes(1);
});
it('returns false when a transport write throws, so the composer can retain its text', () => {
  vi.stubGlobal('WebSocket', FakeSocket);
  chatSocket.connect(vi.fn());
  FakeSocket.instances[0].send.mockImplementationOnce(() => {
    throw new Error('socket closed');
  });
  expect(chatSocket.sendMessage(2, 'Текст')).toBe(false);
  expect(chatSocket.sendMessage(2, 'Текст')).toBe(true);
});

it('reconnects without replaying a history request and ignores the previous transport', () => {
  vi.useFakeTimers();
  vi.stubGlobal('WebSocket', FakeSocket);
  const listener = vi.fn();
  const connection = vi.fn();
  chatSocket.connect(listener, connection);
  const first = FakeSocket.instances[0];
  first.onopen?.();
  const payload = { receiverId: 2, requestId: 'r1', limit: 50 };
  expect(chatSocket.requestHistoryPage(payload)).toBe(true);
  expect(JSON.parse(first.send.mock.calls[0][0])).toEqual({ type: 'GET_HISTORY_PAGE', payload });
  first.onclose?.();
  vi.advanceTimersByTime(1000);
  const reconnected = FakeSocket.instances[1];
  reconnected.onopen?.();
  expect(reconnected.send).not.toHaveBeenCalled();
  expect(connection.mock.calls).toEqual([[true], [false], [true]]);
  const page = {
    type: 'HISTORY_PAGE',
    receiverId: 2,
    requestId: 'r1',
    payload: [],
    hasMore: false,
    nextCursor: null,
  };
  first.onmessage?.({ data: JSON.stringify(page) });
  expect(listener).not.toHaveBeenCalled();
  reconnected.onmessage?.({ data: JSON.stringify(page) });
  expect(listener).toHaveBeenCalledWith(page);
  reconnected.onmessage?.({ data: JSON.stringify({ ...page, hasMore: 'yes' }) });
  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'CHAT_ERROR', requestId: 'r1', receiverId: 2 }),
  );
});
