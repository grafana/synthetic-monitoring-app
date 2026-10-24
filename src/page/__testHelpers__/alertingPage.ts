import { LEGACY_GMA_ALERTS_GROUP } from 'test/fixtures/alerting';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

import { PrometheusAlertingRule } from 'types';
import { ListPrometheusAlertsResponse } from 'datasource/responses.types';

export const HIGH_SENSITIVITY_ALERT = 'SyntheticMonitoringCheckFailureAtHighSensitivity';
export const LOOKUP_WARNING = `Couldn't check for migrated legacy alerts`;

export function serveGrafanaAlertRules(json: ListPrometheusAlertsResponse) {
  server.use(apiRoute('getGrafanaAlertRules', { result: () => ({ json }) }));
}

export function serveMigratedAlerts(...rules: PrometheusAlertingRule[]) {
  serveGrafanaAlertRules({
    data: { groups: [{ ...LEGACY_GMA_ALERTS_GROUP, rules }] },
    status: 'success',
  });
}
