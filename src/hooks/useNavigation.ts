import { getLocationSrv } from '@grafana/runtime';
import { PLUGIN_URL_PATH } from 'components/constants';
import { useHistory } from 'react-router-dom';

export function useNavigation() {
  const history = useHistory();
  const navigate = (url: string, external?: boolean) => {
    const normalized = url.startsWith('/') ? url.slice(1) : url;
    if (external) {
      getLocationSrv().update({ partial: false, path: `/${normalized}` });
    } else {
      history.push(`${PLUGIN_URL_PATH}${normalized}`);
    }
  };
  return navigate;
}
