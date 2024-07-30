import { useEffect, useState } from 'react';
import { getDataSourceSrv, isFetchError } from '@grafana/runtime';

import { ProvisioningLinkedDatasourceInfo } from 'datasource/types';
import { queryClient } from 'data/queryClient';
import { queryDSAccessControl } from 'data/useDSAccessControl';

type DSType = `prometheus` | `loki`;

export function useCheckProvisioning(jsonData: ProvisioningLinkedDatasourceInfo, type: DSType) {
  const [isPending, setIsPending] = useState(true);
  const [data, setData] = useState<string | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    doLookUp(jsonData, type)
      .then((res) => setData(res))
      .catch((e) => setError(e))
      .finally(() => setIsPending(false));
  }, [jsonData, type]);

  return {
    isPending,
    data,
    error,
  };
}

async function doLookUp(data: ProvisioningLinkedDatasourceInfo, type: DSType) {
  if (!data || (!data.grafanaName && !data.hostedId)) {
    return Promise.resolve(undefined);
  }

  const availableDSoptions = getDataSourceSrv().getList();
  const ds = lookupWithGrafanaName(data.grafanaName);

  if (ds) {
    try {
      const res = await fetchAccessControlledDS(ds.uid);
      return res.uid;
    } catch (e) {
      // fallthrough to see if it can find a matching hostedId
      console.error(`grafanaName didn't have a result`);
    }
  }

  try {
    const matchingTypes = availableDSoptions.filter((ds) => ds.type === type).map((ds) => ds.uid);
    const allMatchingDS = await Promise.all(matchingTypes.map(fetchAccessControlledDS));
    const match = allMatchingDS.find((ds) => ds.basicAuthUser === String(data.hostedId));

    if (match) {
      return match.uid;
    }

    throw new Error(
      `Your provisioning file provided a hostedId that didn't match any datasources you have access to. Either choose another datasource or check your provisioning file is set-up correctly or check you have access to the desired datasource.`
    );
  } catch (e) {
    if (isFetchError(e)) {
      throw new Error(e.data.err);
    }

    if (e instanceof Error) {
      throw e;
    }

    throw new Error(`Failed to find a matching datasource`);
  }
}

function lookupWithGrafanaName(grafanaName?: string) {
  return getDataSourceSrv()
    .getList()
    .find((ds) => ds.name === grafanaName);
}

function fetchAccessControlledDS(uid: string) {
  return queryClient.fetchQuery({
    queryKey: [uid],
    queryFn: () => queryDSAccessControl(uid),
  });
}
