import { CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { queryKeys } from 'data/useCheckAlerts';

export function mockAlertsForCheckData(mockData: CheckAlertsResponse = alertsFromApi) {
  queryClient.setQueryData([...queryKeys.listAlertsForCheck], mockData);
}

export const alertsFromApi: CheckAlertsResponse = {
  alerts: [
    {
      name: CheckAlertType['TLSTargetCertificateCloseToExpiring'],
      threshold: 90,
      created: 1724854935,
      modified: 1724854935,
      status: 'OK',
    },
    {
      name: CheckAlertType['ProbeFailedExecutionsTooHigh'],
      threshold: 20,
      created: 1724854935,
      modified: 17,
      status: 'OK',
    },
  ],
};
