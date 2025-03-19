import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { PLUGIN_URL_PATH } from 'routing/constants';

export type QueryParamMap = {
  [key: string]: string;
};

export function useNavigation() {
  const navigate = useNavigate();

  return useCallback(
    (url: string, queryParams?: QueryParamMap, external?: boolean, additionalState?: any) => {
      const normalized = url.startsWith('/') ? url.slice(1) : url;
      const params = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';

      if (external) {
        window.location.href = `${normalized}${params}`;
      } else {
        navigate(`${PLUGIN_URL_PATH}${normalized}${params}`, additionalState);
      }
    },
    [navigate]
  );
}
