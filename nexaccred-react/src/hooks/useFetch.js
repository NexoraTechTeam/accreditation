import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * The one data-fetching hook every screen uses instead of hand-rolling
 * useState/useEffect fetch boilerplate. `path` may be null to skip fetching
 * (e.g. waiting on a param); pass a new `deps` array to refetch when
 * something the path depends on changes.
 */
export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get(path, { signal: controller.signal })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, reloadToken, ...deps]);

  return { data, loading, error, reload };
}
