import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type CommonsState } from './api';

const POLL_MS = 15_000;

export function useCommons() {
  const [state, setState] = useState<CommonsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const next = await api<CommonsState>('/api/state');
      setState(next);
      setError(null);
      setFetchedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the commons.');
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);

  return { state, error, fetchedAt, refresh };
}
