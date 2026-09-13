import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULTS = {
  q: '',
  category: null,
  sortBy: null,
  order: 'asc',
  page: 1,
};

/**
 * The URL is the single source of truth for stock-list filters.
 *
 * Why here and not in Context or component state:
 *   - survives refresh (Requirement #3)
 *   - survives copy-paste between clinic staff (the "share a link" scenario)
 *   - browser back/forward works without extra code
 *
 * This hook is deliberately the ONLY place that reads or writes those
 * params. Every consumer goes through the same normalisation.
 */
export function useStockFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => {
    const page = Number.parseInt(params.get('page') ?? '1', 10);
    return {
      q: params.get('q') ?? DEFAULTS.q,
      category: params.get('category') ?? DEFAULTS.category,
      sortBy: params.get('sortBy') ?? DEFAULTS.sortBy,
      order: params.get('order') === 'desc' ? 'desc' : DEFAULTS.order,
      page: Number.isFinite(page) && page > 0 ? page : DEFAULTS.page,
    };
  }, [params]);

  /**
   * Apply a partial update to the URL.
   *
   * Two deliberate rules:
   *   1. Any change other than `page` resets page to 1. This is what
   *      prevents Requirement #2 ("changing filter strands user on an
   *      empty page").
   *   2. Empty/null values are removed from the URL entirely, so the
   *      URL stays clean and copy-pasteable.
   *
   * `replace` is used so that debounced typing does not push a new
   * history entry per keystroke — the user's Back button should return
   * to the previous page, not to each intermediate query.
   */
  const setFilters = useCallback(
    (updates, { replace = false } = {}) => {
      const next = new URLSearchParams(params);

      Object.entries(updates).forEach(([key, value]) => {
        const isEmpty = value === null || value === undefined || value === '';
        if (isEmpty) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      const onlyPageChanged = Object.keys(updates).every((k) => k === 'page');
      if (!onlyPageChanged) {
        next.delete('page');
      }

      setParams(next, { replace });
    },
    [params, setParams]
  );

  const resetFilters = useCallback(() => {
    setParams(new URLSearchParams(), { replace: false });
  }, [setParams]);

  return { filters, setFilters, resetFilters };
}
