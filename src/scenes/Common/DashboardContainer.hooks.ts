import { AnnotationQuery } from '@grafana/data';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';

const FIRING_CONDITION = `{job="$job", instance="$instance", alertstate="firing"}`;
const PENDING_CONDITION = `{job="$job", instance="$instance", alertstate="pending"}`;

export function useDashboardContainerAnnotations(check: Check) {
  const metricsDS = useMetricsDS();
  const checkHasLegacyAlerts = check.alertSensitivity !== 'none';
  const checkHasPerCheckAlerts = Boolean(check.alerts?.length);

  const alertFiringAnnotation: AnnotationQuery = {
    datasource: metricsDS,
    expr: `max(ALERTS${FIRING_CONDITION} or GRAFANA_ALERTS${FIRING_CONDITION})`,
    hide: false,
    refId: 'alertsAnnotation',
    enable: true,
    iconColor: 'red',
    name: 'Show alerts firing',
    titleFormat: 'Alert firing',
    step: `10s`,
  };

  const alertPendingAnnotation: AnnotationQuery = {
    datasource: metricsDS,
    expr: `max(ALERTS${PENDING_CONDITION} or GRAFANA_ALERTS${PENDING_CONDITION})`,
    hide: false,
    refId: 'alertsAnnotation',
    enable: true,
    iconColor: 'yellow',
    name: 'Show alerts pending',
    titleFormat: 'Alert pending',
    step: `10s`,
  };

  if (checkHasLegacyAlerts) {
    return [alertFiringAnnotation, alertPendingAnnotation];
  }

  if (checkHasPerCheckAlerts) {
    return [alertFiringAnnotation];
  }

  return [];
}
