import { useMemo } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

export const useSearchParams = () => {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location]);
};
