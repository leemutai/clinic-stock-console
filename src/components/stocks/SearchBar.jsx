import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

const DEBOUNCE_MS = 300;

/**
 * Controlled search input that is debounced before it writes to the URL.
 *
 * Local state holds the raw keystrokes so the input stays responsive;
 * the debounced copy is what triggers URL updates and, therefore,
 * network requests. This keeps the URL truthful without firing a
 * request per character.
 */
export function SearchBar({ value, onChange }) {
  const [input, setInput] = useState(value);
  const debouncedInput = useDebounce(input, DEBOUNCE_MS);

  // If the URL changes externally (e.g. back button, pasted link),
  // sync the input back. Without this, the input would drift from
  // the actual query.
  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (debouncedInput !== value) {
      // replace=true: debounced typing should not create history entries.
      onChange(debouncedInput, { replace: true });
    }
  }, [debouncedInput, value, onChange]);

  return (
    <div className="search-bar">
      <label htmlFor="stock-search" className="search-bar__label">
        Search stock
      </label>
      <div className="search-bar__input-wrapper">
        <input
          id="stock-search"
          type="search"
          className="search-bar__input"
          placeholder="Search by title…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {input && (
          <button
            type="button"
            className="search-bar__clear"
            aria-label="Clear search"
            onClick={() => setInput('')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
