import { type QueryKey, useMutation, useQuery } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';
import { trackAlertCreationsAndDeletions } from 'features/tracking/perCheckAlertsEvents';

import { MutationProps } from './types';
import { CheckAlertDraft, CheckAlertPublished } from 'types';
import { FaroEvent } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import { CheckAlertsResponse } from 'datasource/responses.types';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'listAlertsForCheck', QueryKey> = {
  listAlertsForCheck: ['alertsForCheck'],
};

const alertsForCheckQuery = (api: SMDataSource, checkId?: number) => {
  return {
    enabled: Boolean(checkId),
    queryKey: [...queryKeys.listAlertsForCheck, checkId],
    queryFn: () => api.listAlertsForCheck(checkId!),
    select: (data: CheckAlertsResponse) => data.alerts,
  };
};

export function useListAlertsForCheck(checkId?: number) {
  const smDS = useSMDS();
  return useQuery(alertsForCheckQuery(smDS, checkId));
}

export function useUpdateAlertsForCheck({
  eventInfo,
  onError,
  onSuccess,
  onSettled,
  prevAlerts,
}: MutationProps<null> & { prevAlerts?: CheckAlertPublished[] } = {}) {
  const smDS = useSMDS();

  return useMutation<null, Error, { alerts: CheckAlertDraft[]; checkId: number }>({
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
    onSuccess: (data, variables) => {
      trackAlertCreationsAndDeletions(prevAlerts, variables.alerts);
      onSuccess?.(data);
    },
    onSettled: () => {
      onSettled?.();
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
