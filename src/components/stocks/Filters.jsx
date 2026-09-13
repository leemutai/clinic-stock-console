import { useCategories } from '../../hooks/useProducts';

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'title', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'stock', label: 'Stock' },
];

export function Filters({ filters, onChange }) {
  const { data: categories = [], isLoading, isError } = useCategories();

  const isSearching = filters.q.trim().length > 0;

  return (
    <div className="filters" role="group" aria-label="Stock list filters">
      <div className="form-field">
        <label htmlFor="filter-category">Category</label>
        <select
          id="filter-category"
          value={filters.category ?? ''}
          disabled={isSearching || isLoading || isError}
          aria-describedby={isSearching ? 'filter-category-hint' : undefined}
          onChange={(event) => onChange({ category: event.target.value || null })}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        {isSearching && (
          <span id="filter-category-hint" className="form-hint">
            Category filter is unavailable while searching.
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="filter-sort">Sort by</label>
        <select
          id="filter-sort"
          value={filters.sortBy ?? ''}
          onChange={(event) => {
            const sortBy = event.target.value || null;
            onChange({ sortBy, order: sortBy ? filters.order : null });
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filters.sortBy && (
        <div className="form-field">
          <label htmlFor="filter-order">Order</label>
          <select
            id="filter-order"
            value={filters.order}
            onChange={(event) => onChange({ order: event.target.value })}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      )}
    </div>
  );
}
