import { db } from 'test/db';

import { CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const BASIC_CHECK_ALERTS: CheckAlertsResponse = {
  alerts: [
    CheckAlertType.HTTPRequestDurationTooHighP90,
    CheckAlertType.HTTPRequestDurationTooHighP95,
    CheckAlertType.HTTPTargetCertificateCloseToExpiring,
    CheckAlertType.ProbeFailedExecutionsTooHigh,
  ].map((name) => db.alert.build({ name })),
};
