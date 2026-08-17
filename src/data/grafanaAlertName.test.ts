import { CheckAlertType } from 'types';

import {
  alertNamesMatch,
  grafanaManagedAlertName,
  isFiringAlertName,
  stripGrafanaAlertPeriod,
} from './grafanaAlertName';

describe('grafanaManagedAlertName', () => {
  it('appends the Grafana period suffix when a period is set', () => {
    expect(grafanaManagedAlertName(CheckAlertType.HTTPRequestDurationTooHighAvg, '5m')).toBe(
      'HTTPRequestDurationTooHighAvg [5m]'
    );
  });

  it('leaves the check alert type unchanged when there is no period', () => {
    expect(grafanaManagedAlertName(CheckAlertType.TLSTargetCertificateCloseToExpiring)).toBe(
      CheckAlertType.TLSTargetCertificateCloseToExpiring
    );
  });
});

describe('alertNamesMatch', () => {
  it('treats a Grafana period suffix as the same alert', () => {
    expect(alertNamesMatch('HTTPRequestDurationTooHighAvg [5m]', CheckAlertType.HTTPRequestDurationTooHighAvg)).toBe(
      true
    );
    expect(stripGrafanaAlertPeriod('HTTPRequestDurationTooHighAvg [1h]')).toBe(
      CheckAlertType.HTTPRequestDurationTooHighAvg
    );
  });

  it('does not match a different check alert type that happens to share a period', () => {
    expect(
      alertNamesMatch('HTTPRequestDurationTooHighAvg [5m]', `${CheckAlertType.ProbeFailedExecutionsTooHigh} [5m]`)
    ).toBe(false);
  });
});

describe('isFiringAlertName', () => {
  it('finds a firing GRAFANA_ALERTS series by check alert type', () => {
    expect(
      isFiringAlertName(new Set(['HTTPRequestDurationTooHighAvg [5m]']), CheckAlertType.HTTPRequestDurationTooHighAvg)
    ).toBe(true);
  });

  it('finds a suffixed Grafana rule title when Prometheus emitted the unsuffixed name', () => {
    expect(
      isFiringAlertName(new Set([CheckAlertType.HTTPRequestDurationTooHighAvg]), 'HTTPRequestDurationTooHighAvg [5m]')
    ).toBe(true);
  });
});
