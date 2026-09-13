import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';

const LIST_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_LIMIT = 20;

/**
 * Normalise the filter object so query keys are stable.
 * Undefined/null/empty values collapse to canonical nulls, which
 * prevents 'q=' and 'q=undefined' from producing different cache entries.
 */
function normaliseFilters({
  page = 1,
  limit = DEFAULT_LIMIT,
  search,
  category,
  sortBy,
  order,
} = {}) {
  const trimmed = typeof search === 'string' ? search.trim() : '';
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit,
    search: trimmed || null,
    category: category && category !== 'all' ? category : null,
    sortBy: sortBy || null,
    order: order === 'desc' ? 'desc' : sortBy ? 'asc' : null,
  };
}

/**
 * Paginated product list with optional search, category, and sort.
 *
 * Cancellation: TanStack Query v5 forwards an AbortSignal into queryFn.
 * We pass it straight to Axios. When the key changes (new search term,
 * new filter, new page), the previous request is aborted and can never
 * resolve into the current cache entry. This is the mechanism that
 * satisfies Requirement #1 on a 2-second-delayed connection.
 */
export function useProductList(filters) {
  const normalised = normaliseFilters(filters);

  return useQuery({
    queryKey: ['products', normalised],
    queryFn: ({ signal }) => productsApi.getList({ ...normalised, signal }),
    staleTime: LIST_STALE_TIME,
    placeholderData: (previous) => previous,
  });
}

/**
 * Single product. The detail page needs the full object, so this is
 * NOT the same endpoint as the list and does not share the cache key.
 */
export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => productsApi.getProduct(id, { signal }),
    staleTime: LIST_STALE_TIME,
    enabled: Boolean(id),
  });
}

/**
 * Category list. Cached indefinitely — the category set does not change
 * during a session and refetching it wastes bytes on ward tablets.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => productsApi.getCategories({ signal }),
    staleTime: Infinity,
  });
}

/**
 * Stock correction mutation.
 *
 * Behaviour:
 *   onMutate — cancel in-flight queries for this product, snapshot the
 *              previous detail + list caches, write the new stock into
 *              both optimistically, return the snapshot as context.
 *   onError  — restore the snapshot. The cache returns to its pre-edit
 *              state so the UI cannot lie about a failed save.
 *   onSuccess— write the server response into the detail cache (it's
 *              authoritative) and update the matching item in every
 *              cached list page.
 *
 * Why no invalidateQueries in onSuccess: DummyJSON's PUT does not persist.
 * A refetch would replace the corrected value with the original stock.
 * See Decision 3 in the README for the full argument.
 */
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stock }) => productsApi.updateStock(id, stock),

    onMutate: async ({ id, stock }) => {
      // Stop any in-flight fetches for this product so they cannot
      // overwrite our optimistic value when they resolve.
      await queryClient.cancelQueries({ queryKey: ['product', id] });

      const previousDetail = queryClient.getQueryData(['product', id]);

      queryClient.setQueryData(['product', id], (old) => (old ? { ...old, stock } : old));

      // Update every cached list page that contains this product.
      // getQueriesData matches by prefix, so this walks all `['products', ...]`
      // entries regardless of which filters produced them.
      const previousLists = queryClient.getQueriesData({ queryKey: ['products'] });

      queryClient.setQueriesData({ queryKey: ['products'] }, (old) => {
        if (!old || !Array.isArray(old.products)) return old;
        const idx = old.products.findIndex((p) => p.id === id);
        if (idx === -1) return old;
        const next = old.products.slice();
        next[idx] = { ...next[idx], stock };
        return { ...old, products: next };
      });

      return { previousDetail, previousLists };
    },

    onError: (_error, variables, context) => {
      if (!context) return;
      // Restore detail
      if (context.previousDetail !== undefined) {
        queryClient.setQueryData(['product', variables.id], context.previousDetail);
      }
      // Restore all list pages to their snapshots
      if (context.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    onSuccess: (updatedProduct, variables) => {
      // Server response is authoritative. Write it into the detail cache.
      queryClient.setQueryData(['product', variables.id], updatedProduct);

      // Keep list caches in sync without refetching.
      queryClient.setQueriesData({ queryKey: ['products'] }, (old) => {
        if (!old || !Array.isArray(old.products)) return old;
        const idx = old.products.findIndex((p) => p.id === variables.id);
        if (idx === -1) return old;
        const next = old.products.slice();
        next[idx] = { ...next[idx], stock: updatedProduct.stock };
        return { ...old, products: next };
      });
    },
  });
}
