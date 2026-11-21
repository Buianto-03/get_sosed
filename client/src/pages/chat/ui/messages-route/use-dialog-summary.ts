import { useCallback, useEffect, useState } from 'react';
import chatListService from '@entities/chat/api/chatListService';
import type { UserSummary } from '@entities/chat/model/chatListModel';

interface DialogSummary {
  ownerId: number;
  receiverId: number;
  attempt: number;
  summary: UserSummary | null;
  error: string;
}

interface DialogSummaryResult {
  summary: UserSummary | null;
  loading: boolean;
  error: string;
  retry: () => void;
}

export function useDialogSummary(
  ownerId: number | null,
  receiverId: number | null,
): DialogSummaryResult {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<DialogSummary | null>(null);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    setResult(null);
    if (ownerId === null || receiverId === null) {
      return undefined;
    }
    const request = { ownerId, receiverId, attempt };
    const unavailable = 'Собеседник не найден или недоступен.';
    let active = true;
    void chatListService
      .getSummary(receiverId)
      .then((summary) => {
        if (active) {
          setResult(
            summary.id === receiverId
              ? { ...request, summary, error: '' }
              : { ...request, summary: null, error: unavailable },
          );
        }
      })
      .catch(() => {
        if (active) {
          setResult({ ...request, summary: null, error: unavailable });
        }
      });
    return () => {
      active = false;
    };
  }, [ownerId, receiverId, attempt]);

  const current =
    result?.ownerId === ownerId && result.receiverId === receiverId && result.attempt === attempt
      ? result
      : null;
  return {
    summary: current?.summary ?? null,
    error: current?.error ?? '',
    loading: ownerId !== null && receiverId !== null && current === null,
    retry,
  };
}
