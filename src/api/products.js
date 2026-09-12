import { apiClient } from './client';

/**
 * Minimal field set for list views. Ward tablets on patchy Wi-Fi do not
 * need description, images, reviews, or dimensions to render a row.
 * The detail endpoint fetches the full object.
 */
const LIST_FIELDS = 'id,title,price,stock,thumbnail,category,rating';

/**
 * Read the `delay` query param from the current URL, if present.
 * Used to test slow-network behaviour against ?delay=2000.
 * Lives here rather than in components so every request honours it uniformly.
 */
function getTestDelay() {
  if (typeof window === 'undefined') return undefined;
  const value = new URLSearchParams(window.location.search).get('delay');
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 5000 ? parsed : undefined;
}

export const productsApi = {
  /**
   * Fetch a paginated list with optional search, category, and sort.
   *
   * Note on the search/category split — DummyJSON exposes three distinct
   * endpoints and they are NOT composable:
   *   - /products/search?q=...          (no category, sort may be ignored)
   *   - /products/category/{slug}       (no search)
   *   - /products?limit&skip&sortBy&... (no filter)
   * This function enforces that precedence: a non-empty `search` wins,
   * otherwise `category`, otherwise plain list.
   */
  async getList({ page = 1, limit = 20, search, category, sortBy, order, signal } = {}) {
    const skip = (page - 1) * limit;
    const params = { limit, skip };

    const delay = getTestDelay();
    if (delay !== undefined) params.delay = delay;

    let url = '/products';
    const trimmedSearch = typeof search === 'string' ? search.trim() : '';

    if (trimmedSearch) {
      url = '/products/search';
      params.q = trimmedSearch;
    } else if (category && category !== 'all') {
      url = `/products/category/${encodeURIComponent(category)}`;
    } else {
      params.select = LIST_FIELDS;
    }

    // Sort is only reliable on the plain list endpoint.
    if (url === '/products' && sortBy) {
      params.sortBy = sortBy;
      params.order = order === 'desc' ? 'desc' : 'asc';
    }

    const { data } = await apiClient.get(url, { params, signal });
    return data;
  },

  /**
   * Category list. Returns an array of { slug, name, url }.
   * Cached indefinitely by the query layer.
   */
  async getCategories({ signal } = {}) {
    const { data } = await apiClient.get('/products/categories', { signal });
    return data;
  },

  /**
   * Single product. Fetches the full object — the detail page needs
   * description, brand, images, and dimensions.
   */
  async getProduct(id, { signal } = {}) {
    const params = {};
    const delay = getTestDelay();
    if (delay !== undefined) params.delay = delay;

    const { data } = await apiClient.get(`/products/${encodeURIComponent(id)}`, {
      params,
      signal,
    });
    return data;
  },

  /**
   * Update the stock count.
   *
   * DummyJSON's PUT is a mock — it returns the updated object but does NOT
   * persist it. A subsequent GET returns the original stock. The caller
   * (a TanStack Query mutation) therefore treats the response as
   * authoritative and writes it into cache without refetching.
   */
  async updateStock(id, stock) {
    const { data } = await apiClient.put(`/products/${encodeURIComponent(id)}`, { stock });
    return data;
  },
};
