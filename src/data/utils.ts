import { AppEvents } from '@grafana/data';
import appEvents from 'grafana/app/core/app_events';

import { Check } from 'types';
import { MetricCheckSuccess } from 'datasource/responses.types';

const severityMapping = {
  success: AppEvents.alertSuccess,
  warning: AppEvents.alertWarning,
  error: AppEvents.alertError,
};

export const showAlert = (severity: keyof typeof severityMapping = 'success', message: string) => {
  appEvents.emit(severityMapping[severity], [message]);
};

export function findCheckinMetrics<T extends MetricCheckSuccess>(metrics: T[], checkToFind: Check) {
  return metrics.find((entry) => entry.metric.instance === checkToFind.target && entry.metric.job === checkToFind.job);
}
