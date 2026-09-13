import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';
import { ProductCard } from './ProductCard';

export function ProductList({ products, isLoading, isError, error, onRetry, hasFilters }) {
  if (isLoading) {
    return <LoadingState message="Loading stock…" />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        message={
          hasFilters
            ? 'No items match your filters. Try clearing them.'
            : 'No stock items available.'
        }
      />
    );
  }

  return (
    <ul className="product-grid" aria-label="Stock items">
      {products.map((product) => (
        <li key={product.id} className="product-grid__item">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
