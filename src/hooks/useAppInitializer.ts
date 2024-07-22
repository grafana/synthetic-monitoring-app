// import { useState } from 'react';
// import { DataSourceInstanceSettings } from '@grafana/data';
// import { config, FetchError, getBackendSrv } from '@grafana/runtime';
// import { isNumber } from 'lodash';

import { useCallback } from 'react';

import { ROUTES } from 'types';
// import { FaroEvent, reportError, reportEvent } from 'faro';
// import { LinkedDatasourceInfo, SMOptions } from 'datasource/types';
import { useInitSMDatasource, useSMAccessToken } from 'data/useSMDatasource';

// import { getRoute } from 'components/Routing.utils';
import { useMeta } from './useMeta';

export const useAppInitializer = () => {
  const meta = useMeta();
  const { mutate: getAccessToken, isPending: accessTokenloading, error: accessTokenError } = useSMAccessToken();
  const { mutate: initSMDS, isPending: initLoading, error: initError } = useInitSMDatasource();

  const initialize = useCallback(async () => {
    const accessToken = await getAccessToken({});
    await initSMDS({});
  }, [getAccessToken, initSMDS]);

  const loading = accessTokenloading || initLoading;
  const error = accessTokenError || initError;

  return {
    initialize,
    loading,
    error,
    disabled: false,
  };
};
