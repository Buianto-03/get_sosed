import { useEffect, useRef, useState } from 'react';
import advertService from '@entities/advert/api/advertService';
import { initialMyAdverts, mergeAdverts } from './helper';
import type { MyAdvertsState } from './helper';

interface MyAdvertsResult extends MyAdvertsState {
  loadMore: () => Promise<void>;
  retry: () => void;
}

export function useMyAdverts(userId: number | null): MyAdvertsResult {
  const [state, setState] = useState(() => initialMyAdverts(userId));
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    generation.current += 1;
    const requestGeneration = generation.current;
    setState(initialMyAdverts(userId));
    inFlight.current = userId !== null;
    async function loadFirstPage(): Promise<void> {
      try {
        const result = await advertService.getMine(1);
        if (generation.current !== requestGeneration) return;
        setState((previous) => ({
          ...previous,
          items: result.items,
          total: result.total,
          page: result.page,
          hasMore: result.page * result.limit < result.total,
          loading: false,
        }));
      } catch {
        if (generation.current !== requestGeneration) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          error: 'Не удалось загрузить ваши объявления.',
        }));
      } finally {
        if (generation.current === requestGeneration) inFlight.current = false;
      }
    }
    if (userId !== null) void loadFirstPage();
    return () => {
      generation.current += 1;
    };
  }, [userId, attempt]);

  async function loadMore(): Promise<void> {
    if (
      userId === null ||
      state.ownerId !== userId ||
      state.loading ||
      !state.hasMore ||
      inFlight.current
    )
      return;
    const requestGeneration = generation.current;
    inFlight.current = true;
    setState((previous) => ({ ...previous, loadingMore: true, loadMoreError: '' }));
    try {
      const result = await advertService.getMine(state.page + 1);
      if (generation.current !== requestGeneration) return;
      setState((previous) => ({
        ...previous,
        items: mergeAdverts(previous.items, result.items),
        total: result.total,
        page: result.page,
        hasMore: result.page * result.limit < result.total,
        loadingMore: false,
      }));
    } catch {
      if (generation.current !== requestGeneration) return;
      setState((previous) => ({
        ...previous,
        loadingMore: false,
        loadMoreError: 'Не удалось загрузить следующие объявления.',
      }));
    } finally {
      if (generation.current === requestGeneration) inFlight.current = false;
    }
  }

  const visibleState = state.ownerId === userId ? state : initialMyAdverts(userId);
  return { ...visibleState, loadMore, retry: () => setAttempt((value) => value + 1) };
}
