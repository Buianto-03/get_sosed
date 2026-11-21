import { createListenerMiddleware, isAnyOf, nanoid } from '@reduxjs/toolkit';
import {
  historyFailed,
  historyReceived,
  historyStarted,
  loadOlderHistory,
  openHistory,
  retryHistory,
  setChatConnection,
} from '@entities/chat/model/chatListSlice';
import { chatSocket } from '@entities/chat/model/socket';
import type { AppDispatch, RootState } from './store';

export const chatHistoryListener = createListenerMiddleware();

chatHistoryListener.startListening.withTypes<RootState, AppDispatch>()({
  matcher: isAnyOf(openHistory, setChatConnection, historyReceived, loadOlderHistory, retryHistory),
  effect: (action, api) => {
    const { history, connected } = api.getState().chatList;
    if (!history || !connected || history.pending) {
      return;
    }

    let beforeId: number | undefined;
    let afterId: number | undefined;
    if (loadOlderHistory.match(action) || retryHistory.match(action)) {
      if (
        action.payload.ownerId !== history.ownerId ||
        action.payload.receiverId !== history.receiverId
      ) {
        return;
      }
      if (retryHistory.match(action)) {
        if (!history.failed) {
          return;
        }
        ({ beforeId, afterId } = history.failed);
      } else {
        if (history.beforeCursor === null || history.failed || history.afterCursor !== null) {
          return;
        }
        beforeId = history.beforeCursor;
      }
    } else {
      if (history.failed || (history.initialized && history.afterCursor === null)) {
        return;
      }
      afterId = history.afterCursor ?? undefined;
    }

    const request = {
      receiverId: history.receiverId,
      requestId: nanoid(),
      limit: 50,
      beforeId,
      afterId,
    };
    api.dispatch(historyStarted(request));
    if (!chatSocket.requestHistoryPage(request)) {
      api.dispatch(historyFailed(request));
    }
  },
});
