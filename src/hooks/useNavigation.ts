import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getLocationSrv } from '@grafana/runtime';

import { PLUGIN_URL_PATH } from 'components/constants';

export type QueryParamMap = {
  [key: string]: string;
};

export function useNavigation() {
  const history = useHistory();
  const navigate = useCallback(
    (url: string, queryParams?: QueryParamMap, external?: boolean, additionalState?: any) => {
      const normalized = url.startsWith('/') ? url.slice(1) : url;
      if (external) {
        getLocationSrv().update({ partial: false, path: `/${normalized}`, query: queryParams });
      } else {
        const paramString = Object.entries(queryParams ?? {}).reduce(
          (acc, [key, val]) => acc.concat(`&${key}=${val}`),
          ''
        );
        history.push(`${PLUGIN_URL_PATH}${normalized}${paramString ? '?' : ''}${paramString}`, additionalState);
      }
    },
    [history]
  );

  return navigate;
}
