import { CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { QUERY_KEYS } from 'data/useCheckAlerts';

export const ALERTS_FROM_API: CheckAlertsResponse = {
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

export function mockAlertsForCheckData(mockData: CheckAlertsResponse = ALERTS_FROM_API) {
  queryClient.setQueryData([...QUERY_KEYS.listAlertsForCheck], mockData);
}
