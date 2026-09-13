const MAX_VISIBLE = 5;

function buildPageRange(current, total) {
  const half = Math.floor(MAX_VISIBLE / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + MAX_VISIBLE - 1);
  if (end - start < MAX_VISIBLE - 1) {
    start = Math.max(1, end - MAX_VISIBLE + 1);
  }
  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

export function Pagination({ currentPage, totalPages, onPageChange, disabled = false }) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages);
  const canPrev = currentPage > 1 && !disabled;
  const canNext = currentPage < totalPages && !disabled;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <ol className="pagination__list">
        {pages[0] > 1 && (
          <>
            <li>
              <button
                type="button"
                className="pagination__button"
                onClick={() => onPageChange(1)}
                disabled={disabled}
              >
                1
              </button>
            </li>
            {pages[0] > 2 && (
              <li className="pagination__ellipsis" aria-hidden="true">
                …
              </li>
            )}
          </>
        )}

        {pages.map((page) => (
          <li key={page}>
            <button
              type="button"
              className={`pagination__button${page === currentPage ? ' is-current' : ''}`}
              onClick={() => onPageChange(page)}
              disabled={disabled}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          </li>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <li className="pagination__ellipsis" aria-hidden="true">
                …
              </li>
            )}
            <li>
              <button
                type="button"
                className="pagination__button"
                onClick={() => onPageChange(totalPages)}
                disabled={disabled}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}
      </ol>

      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canNext}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
