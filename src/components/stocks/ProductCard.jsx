import { Link } from 'react-router-dom';

function stockLevel(stock) {
  if (stock <= 5) return 'low';
  if (stock <= 20) return 'medium';
  return 'high';
}

export function ProductCard({ product }) {
  const level = stockLevel(product.stock);

  return (
    <article className="product-card">
      <Link to={`/items/${product.id}`} className="product-card__link">
        <img className="product-card__image" src={product.thumbnail} alt="" loading="lazy" />
        <div className="product-card__body">
          <h3 className="product-card__title">{product.title}</h3>
          <p className="product-card__category">{product.category}</p>
          <p className="product-card__price">${product.price.toFixed(2)}</p>
          <p className={`stock-badge stock-badge--${level}`}>
            <span className="stock-badge__label">Stock</span>
            <span className="stock-badge__value">{product.stock}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
