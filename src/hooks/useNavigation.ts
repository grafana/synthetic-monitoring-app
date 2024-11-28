import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { getLocationSrv } from '@grafana/runtime';

import { PLUGIN_URL_PATH } from 'routing/constants';

export type QueryParamMap = {
  [key: string]: string;
};

export function useNavigation() {
  const navigate = useNavigate();

  return useCallback(
    (url: string, queryParams?: QueryParamMap, external?: boolean, additionalState?: any) => {
      const normalized = url.startsWith('/') ? url.slice(1) : url;
      if (external) {
        getLocationSrv().update({ partial: false, path: `/${normalized}`, query: queryParams });
      } else {
        const paramString = Object.entries(queryParams ?? {}).reduce(
          (acc, [key, val]) => acc.concat(`&${key}=${val}`),
          ''
        );
        navigate(`${PLUGIN_URL_PATH}${normalized}${paramString ? '?' : ''}${paramString}`, additionalState);
      }
    },
    [navigate]
  );
}
