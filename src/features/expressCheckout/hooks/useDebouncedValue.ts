import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delayMs`: updates settle only after the value stops changing for that
 * long. Used by the config sheet so a slider drag does not remount the express element per step.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
