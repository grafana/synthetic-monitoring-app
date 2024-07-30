import { useCallback, useState } from 'react';

import { SMPluginInstallResponse } from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { queryDSAccessControl } from 'data/useDSAccessControl';
import { useCreateSMDatasource, useSMAccessToken } from 'data/useSMSetup';
import { useMeta } from 'hooks/useMeta';

export const useAppInitializer = (onSuccess: () => void) => {
  const { jsonData, id } = useMeta();
  const [hostedIdsPending, setHostedIdsPending] = useState(false);
  const [hostedIdsError, setHostedIdsError] = useState<Error | null>(null);
  const { mutate: createSMDS, error: createError, isPending: createPending } = useCreateSMDatasource();
  const { mutate: getAccessToken, error: tokenError, isPending: tokenPending } = useSMAccessToken();

  const initialize = useCallback(
    (logsUid: string, metricsUid: string, smDSName: string) => {
      setHostedIdsPending(true);
      getHostedIds(logsUid, metricsUid)
        .then(([logsDS, metricsDS]) => {
          setHostedIdsPending(false);
          getAccessToken(
            {
              id,
              data: {
                stackId: jsonData.stackId,
                metricsInstanceId: Number(metricsDS.basicAuthUser),
                logsInstanceId: Number(logsDS.basicAuthUser),
              },
            },
            {
              onSuccess: async ({ accessToken, tenantInfo }: SMPluginInstallResponse) => {
                createSMDS(
                  {
                    accessToken,
                    apiHost: jsonData.apiHost,
                    name: smDSName,
                    logs: {
                      hostedId: tenantInfo.logInstance.id,
                      type: logsDS.type,
                      uid: logsDS.uid,
                    },
                    metrics: {
                      hostedId: tenantInfo.logInstance.id,
                      type: metricsDS.type,
                      uid: metricsDS.uid,
                    },
                  },
                  {
                    onSuccess,
                  }
                );
              },
            }
          );
        })
        .catch((e) => {
          setHostedIdsError(e);
          setHostedIdsPending(false);
        });
    },
    [createSMDS, getAccessToken, id, jsonData, onSuccess]
  );

  const isLoading = hostedIdsPending || tokenPending || createPending;
  const error = hostedIdsError || tokenError || createError;

  return {
    isLoading,
    error,
    initialize,
  };
};

function getHostedIds(logsUid: string, metricsUid: string) {
  return Promise.all([fetchAccessControlledDS(logsUid), fetchAccessControlledDS(metricsUid)]);
}

function fetchAccessControlledDS(uid: string) {
  return queryClient.fetchQuery({
    queryKey: [uid],
    queryFn: () => queryDSAccessControl(uid),
  });
}
