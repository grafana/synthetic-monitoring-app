import { db } from 'test/db';

import { CheckAlertError, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const BASIC_CHECK_ALERTS: CheckAlertsResponse = {
  alerts: [
    db.alert.build({
      name: CheckAlertType.ProbeFailedExecutionsTooHigh,
    }),
    db.alert.build({
      name: CheckAlertType.TLSTargetCertificateCloseToExpiring,
      status: 'PENDING_CREATE',
      error: CheckAlertError.HostedGrafanaInstanceLoading,
    }),
    db.alert.build({
      name: CheckAlertType.HTTPRequestDurationTooHighAvg,
    }),
    db.alert.build({
      name: CheckAlertType.PingRequestDurationTooHighAvg,
    }),
    db.alert.build({
      name: CheckAlertType.DNSRequestDurationTooHighAvg,
    }),
  ],
};
