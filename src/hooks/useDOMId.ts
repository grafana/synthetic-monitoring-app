import { useId } from 'react';

// By default React uses colons as the delimiter, which aren't actually valid in CSS selectors
// which also means they will get flagged as failures in accessibility testing
// https://github.com/facebook/react/issues/26839

export function useDOMId() {
  return useId().replace(/:/g, '_');
}
