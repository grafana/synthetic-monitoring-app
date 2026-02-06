import { useCallback } from 'react';
import { locationService } from '@grafana/runtime';

import { PLUGIN_URL_PATH } from 'routing/constants';

export type QueryParamMap = {
  [key: string]: string;
};

export function useNavigation() {
  return useCallback((url: string, queryParams?: QueryParamMap, external?: boolean) => {
    const normalized = url.startsWith('/') ? url.slice(1) : url;
    const params = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';

    if (external) {
      window.location.href = `${normalized}${params}`;
    } else {
      locationService.push(`${PLUGIN_URL_PATH}${normalized}${params}`);
    }
  }, []);
}
