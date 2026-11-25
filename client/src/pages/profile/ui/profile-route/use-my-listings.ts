import { useEffect, useRef, useState } from 'react';
import { listingService } from '@entities/listing/api/listingService';
import { isRequestCanceled } from '@shared/api/cancellation';
import { initialMyListings, mergeListings } from './helper';
import type { MyListingsState } from './helper';

interface MyListingsResult extends MyListingsState {
  loadMore: () => Promise<void>;
  retry: () => void;
}

export function useMyListings(userId: number | null): MyListingsResult {
  const [state, setState] = useState(() => initialMyListings(userId));
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const controllerRef = useRef<AbortController>();

  useEffect(() => {
    generation.current += 1;
    const requestGeneration = generation.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    setState(initialMyListings(userId));
    inFlight.current = userId !== null;
    async function loadFirstPage(): Promise<void> {
      try {
        const result = await listingService.getMine(1, 12, { signal: controller.signal });
        if (generation.current !== requestGeneration) {
          return;
        }
        setState((previous) => ({
          ...previous,
          items: result.items,
          total: result.total,
          page: result.page,
          hasMore: result.page * result.limit < result.total,
          loading: false,
        }));
      } catch (error) {
        if (generation.current !== requestGeneration) {
          return;
        }
        setState((previous) => ({
          ...previous,
          loading: false,
          error: isRequestCanceled(error) ? '' : 'Не удалось загрузить ваши объявления.',
        }));
      } finally {
        if (generation.current === requestGeneration) {
          inFlight.current = false;
        }
      }
    }
    if (userId !== null) {
      void loadFirstPage();
    }
    return () => {
      generation.current += 1;
      controller.abort();
    };
  }, [userId, attempt]);

  async function loadMore(): Promise<void> {
    if (
      userId === null ||
      state.ownerId !== userId ||
      state.loading ||
      !state.hasMore ||
      inFlight.current
    ) {
      return;
    }
    const requestGeneration = generation.current;
    const signal = controllerRef.current?.signal;
    if (!signal || signal.aborted) {
      return;
    }
    inFlight.current = true;
    setState((previous) => ({ ...previous, loadingMore: true, loadMoreError: '' }));
    try {
      const result = await listingService.getMine(state.page + 1, 12, { signal });
      if (generation.current !== requestGeneration) {
        return;
      }
      setState((previous) => ({
        ...previous,
        items: mergeListings(previous.items, result.items),
        total: result.total,
        page: result.page,
        hasMore: result.page * result.limit < result.total,
        loadingMore: false,
      }));
    } catch (error) {
      if (generation.current !== requestGeneration) {
        return;
      }
      setState((previous) => ({
        ...previous,
        loadingMore: false,
        loadMoreError: isRequestCanceled(error) ? '' : 'Не удалось загрузить следующие объявления.',
      }));
    } finally {
      if (generation.current === requestGeneration) {
        inFlight.current = false;
      }
    }
  }

  const visibleState = state.ownerId === userId ? state : initialMyListings(userId);
  return { ...visibleState, loadMore, retry: () => setAttempt((value) => value + 1) };
}
