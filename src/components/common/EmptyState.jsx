export function EmptyState({ message = 'No results found.' }) {
  return (
    <div role="status" aria-live="polite" className="state state--empty">
      <p className="state__message">{message}</p>
    </div>
  );
}
