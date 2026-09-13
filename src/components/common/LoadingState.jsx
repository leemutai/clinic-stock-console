export function LoadingState({ message = 'Loading…' }) {
  return (
    <div role="status" aria-live="polite" className="state state--loading">
      <span className="state__spinner" aria-hidden="true" />
      <p className="state__message">{message}</p>
    </div>
  );
}
