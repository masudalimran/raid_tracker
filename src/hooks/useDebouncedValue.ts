import { useEffect, useState } from "react";

/** Delays reacting to a fast-changing value (e.g. search input) until it's been stable for `delayMs`, so expensive filtering/rendering doesn't run on every keystroke. The input itself should stay bound to the raw, un-debounced value so typing feels instant. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
