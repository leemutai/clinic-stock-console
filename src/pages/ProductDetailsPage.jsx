import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { StockUpdateForm } from '../components/stocks/StockUpdateForm';
import { useProduct } from '../hooks/useProducts';

function stockLevel(stock) {
  if (stock <= 5) return 'low';
  if (stock <= 20) return 'medium';
  return 'high';
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);

  if (isLoading) {
    return <LoadingState message="Loading item…" />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (!product) {
    return <ErrorState error={{ message: 'Item not found.' }} />;
  }

  const level = stockLevel(product.stock);

  return (
    <div className="product-detail">
      <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">← Back to stock list</Link>
      </nav>

      <article className="product-detail__main">
        <div className="product-detail__image-wrapper">
          <img
            className="product-detail__image"
            src={product.images?.[0] ?? product.thumbnail}
            alt=""
          />
        </div>

        <div className="product-detail__info">
          <header>
            <p className="product-detail__category">{product.category}</p>
            <h1 className="product-detail__title">{product.title}</h1>
            {product.brand && <p className="product-detail__brand">by {product.brand}</p>}
          </header>

          <p className="product-detail__description">{product.description}</p>

          <dl className="product-detail__meta">
            <div>
              <dt>Price</dt>
              <dd>${product.price.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{product.rating?.toFixed(1) ?? '—'} / 5</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{product.sku ?? `#${product.id}`}</dd>
            </div>
          </dl>

          <div className={`stock-badge stock-badge--${level} stock-badge--lg`}>
            <span className="stock-badge__label">In stock</span>
            <span className="stock-badge__value">{product.stock}</span>
          </div>

          <StockUpdateForm product={product} />
        </div>
      </article>
    </div>
  );
}
