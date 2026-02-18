import { CheckAlertError, CheckAlertType } from 'types';
import { CheckAlertsResponse } from 'datasource/responses.types';

import { DB } from '../db';

export const BASIC_CHECK_ALERTS: CheckAlertsResponse = {
  alerts: [
    DB.alert.build({
      name: CheckAlertType.ProbeFailedExecutionsTooHigh,
      runbookUrl: 'https://example.com/runbooks/probe-failures',
    }),
    DB.alert.build({
      name: CheckAlertType.TLSTargetCertificateCloseToExpiring,
      status: 'PENDING_CREATE',
      error: CheckAlertError.HostedGrafanaInstanceLoading,
      runbookUrl: 'https://example.com/runbooks/tls-certificate',
    }),
    DB.alert.build({
      name: CheckAlertType.HTTPRequestDurationTooHighAvg,
      runbookUrl: 'https://example.com/runbooks/http-latency',
    }),
    DB.alert.build({
      name: CheckAlertType.PingRequestDurationTooHighAvg,
      runbookUrl: 'https://example.com/runbooks/ping-latency',
    }),
    DB.alert.build({
      name: CheckAlertType.DNSRequestDurationTooHighAvg,
      runbookUrl: 'https://example.com/runbooks/dns-latency',
    }),
  ],
};
