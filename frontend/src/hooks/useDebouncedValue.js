import { useEffect, useState } from "react";

// Returns `value` only after it has stopped changing for `delay` ms — used so search boxes
// don't fire a request on every keystroke.
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
