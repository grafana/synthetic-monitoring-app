import { useRef } from 'react';

/**
 * Keeps the last present value while a query is refreshing so the UI does not
 * flash back to a dataless placeholder between settled results.
 */
export function useStableWhileLoading<T>(
  value: T,
  isLoading: boolean,
  isEmpty: (value: T) => boolean = (candidate) => candidate == null
): T {
  const stableRef = useRef(value);

  if (!isEmpty(value) || !isLoading) {
    stableRef.current = value;
  }

  return stableRef.current;
}
