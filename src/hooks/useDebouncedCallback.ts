import { useCallback, useEffect, useRef } from "react";

/** Returns a debounced wrapper around `callback` — useful when the side effect of a fast-changing input needs to land somewhere other than local state (e.g. writing to the URL), where a plain useDebouncedValue + useEffect pair would mean calling a setState synchronously inside an effect body. */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 300,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return useCallback((...args: Args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
  }, [delayMs]);
}
