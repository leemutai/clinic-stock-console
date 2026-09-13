import { useCallback, useMemo } from 'react';
import { Filters } from '../components/stocks/Filters';
import { Pagination } from '../components/stocks/Pagination';
import { ProductList } from '../components/stocks/ProductList';
import { SearchBar } from '../components/stocks/SearchBar';
import { useProductList } from '../hooks/useProducts';
import { useStockFilters } from '../hooks/useStockFilters';

const PAGE_SIZE = 20;

export function StockPage() {
  const { filters, setFilters } = useStockFilters();

  const queryFilters = useMemo(
    () => ({
      page: filters.page,
      limit: PAGE_SIZE,
      search: filters.q,
      category: filters.category,
      sortBy: filters.sortBy,
      order: filters.order,
    }),
    [filters]
  );

  const { data, isLoading, isError, error, refetch } = useProductList(queryFilters);

  const handleSearchChange = useCallback(
    (value, options) => setFilters({ q: value }, options),
    [setFilters]
  );

  const handleFilterChange = useCallback((updates) => setFilters(updates), [setFilters]);

  const handlePageChange = useCallback(
    (nextPage) => {
      setFilters({ page: nextPage });
      // Scroll to top so tablet users see the new page rather than the footer.
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [setFilters]
  );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const hasFilters = Boolean(filters.q || filters.category || filters.sortBy);

  return (
    <div className="stock-page">
      <div className="stock-page__controls">
        <SearchBar value={filters.q} onChange={handleSearchChange} />
        <Filters filters={filters} onChange={handleFilterChange} />
      </div>

      {!isLoading && !isError && data && (
        <p className="stock-page__summary" role="status" aria-live="polite">
          {data.total} {data.total === 1 ? 'item' : 'items'}
          {hasFilters ? ' matched' : ''}
        </p>
      )}

      <ProductList
        products={data?.products}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        hasFilters={hasFilters}
      />

      {!isLoading && !isError && data && (
        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          disabled={isLoading}
        />
      )}
    </div>
  );
}
