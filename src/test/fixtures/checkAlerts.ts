import { db } from 'test/db';

import { CheckAlertError, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const BASIC_CHECK_ALERTS: CheckAlertsResponse = {
  alerts: [
    db.alert.build({
      name: CheckAlertType.ProbeFailedExecutionsTooHigh,
      status: 'PENDING_CREATE',
      error: CheckAlertError.QuotaLimitReached,
    }),
    db.alert.build({
      name: CheckAlertType.TLSTargetCertificateCloseToExpiring,
      status: 'PENDING_CREATE',
      error: CheckAlertError.HostedGrafanaInstanceLoading,
    }),
  ],
};
