import { getLocationSrv } from '@grafana/runtime';
import { PLUGIN_URL_PATH } from 'components/constants';
import { useHistory } from 'react-router-dom';

export type QueryParamMap = {
  [key: string]: string;
};

export function useNavigation() {
  const history = useHistory();
  const navigate = (url: string, queryParams?: QueryParamMap, external?: boolean, additionalState?: any) => {
    const normalized = url.startsWith('/') ? url.slice(1) : url;
    if (external) {
      getLocationSrv().update({ partial: false, path: `/${normalized}`, query: queryParams });
    } else {
      console.log('queryParams', queryParams, 'additionalState', additionalState);

      const paramString = Object.entries(queryParams ?? {}).reduce(
        (acc, [key, val]) => acc.concat(`&${key}=${val}`),
        ''
      );
      history.push(`${PLUGIN_URL_PATH}${normalized}${paramString ? '?' : ''}${paramString}`, additionalState);
    }
  };
  return navigate;
}
