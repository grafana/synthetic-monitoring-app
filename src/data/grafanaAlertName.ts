/** Grafana titles SM per-check rules as `{CheckAlertType} [{period}]`. */
const GRAFANA_ALERT_PERIOD_SUFFIX = / \[\d+[smhdw]\]$/;

export function grafanaManagedAlertName(name: string, period?: string): string {
  return period ? `${name} [${period}]` : name;
}

export function stripGrafanaAlertPeriod(alertname: string): string {
  return alertname.replace(GRAFANA_ALERT_PERIOD_SUFFIX, '');
}

export function alertNamesMatch(left: string, right: string): boolean {
  return left === right || stripGrafanaAlertPeriod(left) === stripGrafanaAlertPeriod(right);
}

export function isFiringAlertName(firingAlertNames: Iterable<string>, alertName: string): boolean {
  for (const name of firingAlertNames) {
    if (alertNamesMatch(name, alertName)) {
      return true;
    }
  }

  return false;
}
