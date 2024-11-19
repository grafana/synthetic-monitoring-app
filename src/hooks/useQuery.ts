import { useMemo } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

export function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}
