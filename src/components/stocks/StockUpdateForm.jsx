import { useEffect, useId, useState } from 'react';
import { useUpdateStock } from '../../hooks/useProducts';

export function StockUpdateForm({ product }) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  const [value, setValue] = useState(String(product.stock));
  const [feedback, setFeedback] = useState(null);

  const mutation = useUpdateStock();

  // If the product changes (navigating between details), reset the form.
  useEffect(() => {
    setValue(String(product.stock));
    setFeedback(null);
  }, [product.id, product.stock]);

  const parsed = Number.parseInt(value, 10);
  const isValid = Number.isFinite(parsed) && parsed >= 0;
  const isDirty = isValid && parsed !== product.stock;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isDirty || mutation.isPending) return;

    setFeedback(null);

    try {
      await mutation.mutateAsync({ id: product.id, stock: parsed });
      setFeedback({ type: 'success', message: 'Stock updated.' });
    } catch (error) {
      // The hook has already rolled the cache back. We just surface
      // the failure next to the form so the user can retry.
      const message =
        error?.response?.status === 500
          ? 'The server rejected the update. Please try again.'
          : (error?.message ?? 'Update failed.');
      setFeedback({ type: 'error', message });
    }
  };

  return (
    <form className="stock-form" onSubmit={handleSubmit} noValidate>
      <h2 className="stock-form__heading">Correct stock count</h2>

      <div className="form-field">
        <label htmlFor={inputId}>New stock count</label>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={mutation.isPending}
          aria-describedby={`${helpId}${feedback?.type === 'error' ? ` ${errorId}` : ''}`}
          aria-invalid={!isValid || feedback?.type === 'error' ? 'true' : undefined}
        />
        <span id={helpId} className="form-hint">
          Physical count correction. Current system value: {product.stock}.
        </span>
      </div>

      {feedback?.type === 'error' && (
        <p id={errorId} role="alert" className="form-error">
          {feedback.message}
        </p>
      )}

      {feedback?.type === 'success' && (
        <p role="status" className="form-success">
          {feedback.message}
        </p>
      )}

      <div className="stock-form__actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!isDirty || mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Save stock count'}
        </button>
      </div>
    </form>
  );
}
