import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay`
 * milliseconds have passed without `value` changing.
 *
 * Typical use:
 *   const [input, setInput] = useState('');
 *   const debounced = useDebounce(input, 300);
 *   useEffect(() => { updateUrlQuery(debounced); }, [debounced]);
 *
 * The timer is cleared on every change to `value` or `delay`, and on
 * unmount, so a pending update can never fire against a stale render.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
