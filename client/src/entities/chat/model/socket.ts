import { WS_URL } from '@shared/config/env';
import { historyPageEnvelope, incomingMessageSchema } from './protocol';
import type { HistoryPageRequest, IncomingMessage, OutgoingMessage } from './protocol';

type SocketListener = (message: IncomingMessage) => void;

class ChatSocket {
  private socket: WebSocket | null = null;

  private listener: SocketListener | null = null;

  private retryTimer: number | null = null;

  private retries = 0;

  private onConnection: ((connected: boolean) => void) | null = null;

  connect(listener: SocketListener, onConnection?: (connected: boolean) => void): void {
    this.disconnect();
    this.retries = 0;
    this.listener = listener;
    this.onConnection = onConnection ?? null;
    this.open();
  }

  private open(): void {
    if (!this.listener) {
      return;
    }
    const socket = new WebSocket(WS_URL);
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) {
        return;
      }
      this.onConnection?.(true);
      this.retries = 0;
    };
    socket.onmessage = (event: MessageEvent) => {
      if (this.socket !== socket) {
        return;
      }
      try {
        const data: unknown = JSON.parse(event.data as string);
        const parsed = incomingMessageSchema.safeParse(data);
        if (parsed.success) {
          this.listener?.(parsed.data);
        } else {
          const envelope = historyPageEnvelope.safeParse(data);
          if (envelope.success) {
            const { requestId, receiverId } = envelope.data;
            this.listener?.({
              type: 'CHAT_ERROR',
              requestId,
              receiverId,
              payload: 'Некорректная страница истории.',
            });
          }
        }
      } catch {
        // Ignore malformed server events and keep the connection alive.
      }
    };
    socket.onclose = () => {
      if (!this.listener || this.socket !== socket) {
        return;
      }
      this.socket = null;
      this.onConnection?.(false);
      const delay = Math.min(1000 * 2 ** this.retries, 10000);
      this.retries += 1;
      this.retryTimer = window.setTimeout(() => this.open(), delay);
    };
  }

  private send(action: OutgoingMessage): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.socket.send(JSON.stringify(action));
      return true;
    } catch {
      return false;
    }
  }

  requestHistoryPage(payload: HistoryPageRequest): boolean {
    return this.send({ type: 'GET_HISTORY_PAGE', payload });
  }

  sendMessage(receiverId: number, text: string): boolean {
    return this.send({ type: 'ADD_MESSAGE', payload: { receiverId, text } });
  }

  disconnect(): void {
    this.listener = null;
    this.onConnection?.(false);
    this.onConnection = null;
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
    }
    this.retryTimer = null;
    const { socket } = this;
    this.socket = null;
    socket?.close();
  }
}

export const chatSocket = new ChatSocket();
