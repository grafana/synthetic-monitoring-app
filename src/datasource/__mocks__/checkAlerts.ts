import { CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { queryKeys } from 'data/useCheckAlerts';

export function mockAlertsForCheckData(mockData: CheckAlertsResponse = alertsFromApi) {
  queryClient.setQueryData([queryKeys.listAlertsForCheck], mockData);
}

export const alertsFromApi: CheckAlertsResponse = {
  alerts: [
    {
      id: 1,
      name: CheckAlertType['HTTPRequestDurationTooHighP90'],
      threshold: 350,
      created: 1724854935,
      modified: 1724854935,
    },
    {
      id: 1,
      name: CheckAlertType['HTTPRequestDurationTooHighP95'],
      threshold: 100,
      created: 1724854935,
      modified: 1724854935,
    },
    {
      id: 1,
      name: CheckAlertType['HTTPTargetCertificateCloseToExpiring'],
      threshold: 90,
      created: 1724854935,
      modified: 1724854935,
    },
    {
      id: 1,
      name: CheckAlertType['PingICMPDurationTooHighP99'],
      threshold: 20,
      created: 1724854935,
      modified: 1724854935,
    },
  ],
};
