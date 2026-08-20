import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delayMs` — updates settle only after the value stops changing for that
 * long. Used to debounce the book-detail qty selector so rapid ± clicks don't rebuild the express
 * session on every intermediate value.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
