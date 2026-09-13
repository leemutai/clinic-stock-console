import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from '../../src/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value synchronously', () => {
    // The hook must not delay the *first* render, only subsequent updates.
    // Otherwise every consumer would render with `undefined` on mount.
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('updates only after the delay has elapsed', () => {
    // A naive implementation returns the new value immediately and
    // debounces nothing. This test catches that.
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('resets the timer when the value changes within the delay window', () => {
    // This is the debounce behaviour proper: rapid keystrokes produce
    // one update, not one per keystroke. Without clearTimeout in the
    // effect cleanup, this test fails.
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');

    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 400ms of wall time has passed, but no single 300ms window has.
    // The value must still be the original.
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Now 300ms have passed since the last change.
    expect(result.current).toBe('abc');
  });
});
