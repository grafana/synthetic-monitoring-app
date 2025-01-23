import { type QueryKey, useMutation, useQuery } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';

import { MutationProps } from './types';
import { CheckAlertDraft } from 'types';
import { FaroEvent } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import { CheckAlertsResponse } from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { useSMDS } from 'hooks/useSMDS';
export const queryKeys: Record<'listAlertsForCheck', QueryKey> = {
  listAlertsForCheck: ['alertsForCheck'],
};

const alertsForCheckQuery = (api: SMDataSource, checkId?: number) => {
  return {
    enabled: Boolean(checkId),
    queryKey: [...queryKeys.listAlertsForCheck, checkId],
    queryFn: () => api.listAlertsForCheck(checkId!),
  };
};

export function useListAlertsForCheck(checkId?: number) {
  const smDS = useSMDS();
  return useQuery(alertsForCheckQuery(smDS, checkId));
}

export function useUpdateAlertsForCheck({ eventInfo, onError, onSuccess }: MutationProps<CheckAlertsResponse> = {}) {
  const smDS = useSMDS();

  return useMutation<CheckAlertsResponse, Error, { alerts: CheckAlertDraft[]; checkId: number }>({
    mutationFn: async ({ alerts, checkId }) => {
      try {
        return await smDS.updateAlertsForCheck(alerts, checkId);
      } catch (error) {
        throw handleError(error);
      }
    },
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listAlertsForCheck });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: FaroEvent.UPDATE_CHECK_ALERTS,
      },
      errorAlert: () => `Failed to save alerts for check`,
    },
  });
}

function handleError(error: unknown) {
  if (isFetchError(error)) {
    return new Error(error.data.err);
  }

  return error;
}
