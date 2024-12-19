import { db } from 'test/db';

import { CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const BASIC_CHECK_ALERTS: CheckAlertsResponse = {
  alerts: [
    db.alert.build({
      id: 1,
      name: CheckAlertType['HTTPRequestDurationTooHighP90'],
    }),
    db.alert.build({
      id: 2,
      name: CheckAlertType['HTTPRequestDurationTooHighP95'],
    }),
    db.alert.build({
      id: 3,
      name: CheckAlertType['HTTPTargetCertificateCloseToExpiring'],
    }),
    db.alert.build({
      id: 4,
      name: CheckAlertType['ProbeFailedExecutionsTooHigh'],
    }),
  ],
};
