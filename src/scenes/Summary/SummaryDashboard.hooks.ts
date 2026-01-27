import { AnnotationQuery } from '@grafana/data';

import { useMetricsDS } from 'hooks/useMetricsDS';

export function useSummaryDashboardAnnotations() {
  const metricsDS = useMetricsDS();

  if (!metricsDS?.uid) {
    return [];
  }

  const alertFiringAnnotation: AnnotationQuery = {
    datasource: metricsDS,
    expr: 'max(ALERTS{namespace="synthetic_monitoring", alertstate="firing"}) by (instance, job)',
    hide: false,
    legendFormat: '{{job}}/{{instance}}',
    refId: 'alertsAnnotation',
    enable: true,
    iconColor: 'red',
    name: 'Alert firing',
    titleFormat: 'Firing: {{job}}/{{instance}}',
  };

  const alertPendingAnnotation: AnnotationQuery = {
    datasource: metricsDS,
    expr: 'max(ALERTS{namespace="synthetic_monitoring", alertstate="pending"}) by (instance, job)',
    hide: false,
    legendFormat: '{{job}}/{{instance}}',
    refId: 'alertsAnnotation',
    enable: true,
    iconColor: 'yellow',
    name: 'Alert pending',
    titleFormat: 'Pending: {{job}}/{{instance}}',
  };

  return [alertFiringAnnotation, alertPendingAnnotation];
}

