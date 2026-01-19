import { CheckAlertError, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

import { db } from '../db';

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
    db.alert.build({
      name: CheckAlertType.HTTPRequestDurationTooHighAvg,
      runbookUrl: 'https://example.com/runbooks/http-latency',
    }),
    db.alert.build({
      name: CheckAlertType.PingRequestDurationTooHighAvg,
      runbookUrl: 'https://example.com/runbooks/ping-latency',
    }),
    db.alert.build({
      name: CheckAlertType.DNSRequestDurationTooHighAvg,
      runbookUrl: 'https://example.com/runbooks/dns-latency',
    }),
  ],
};
