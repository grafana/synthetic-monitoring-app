import { db } from 'test/db';

import { CheckAlertError, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const BASIC_CHECK_ALERTS: CheckAlertsResponse = {
  alerts: [
    db.alert.build({
      name: CheckAlertType.ProbeFailedExecutionsTooHigh,
      runbookUrl: 'https://example.com/runbooks/probe-failures',
    }),
    db.alert.build({
      name: CheckAlertType.TLSTargetCertificateCloseToExpiring,
      status: 'PENDING_CREATE',
      error: CheckAlertError.HostedGrafanaInstanceLoading,
      runbookUrl: 'https://example.com/runbooks/tls-certificate',
    }),
  ],
};
