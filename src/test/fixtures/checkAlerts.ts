import { CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const BASIC_CHECK_ALERTS: CheckAlertsResponse = {
  alerts: [
    {
      name: CheckAlertType['HTTPRequestDurationTooHighP90'],
      threshold: 350,
      created: 1724854935,
      modified: 1724854935,
    },
    {
      name: CheckAlertType['HTTPRequestDurationTooHighP95'],
      threshold: 100,
      created: 1724854935,
      modified: 1724854935,
    },
    {
      name: CheckAlertType['HTTPTargetCertificateCloseToExpiring'],
      threshold: 90,
      created: 1724854935,
      modified: 1724854935,
    },
    {
      name: CheckAlertType['ProbeFailedExecutionsTooHigh'],
      threshold: 20,
      created: 1724854935,
      modified: 1724854935,
    },
  ],
};
