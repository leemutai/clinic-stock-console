export function ErrorState({ error, onRetry, retryLabel = 'Try again' }) {
  const message =
    error?.response?.data?.message ?? error?.message ?? 'Something went wrong. Please try again.';

  return (
    <div role="alert" aria-live="assertive" className="state state--error">
      <p className="state__message">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
