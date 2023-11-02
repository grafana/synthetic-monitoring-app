import { AlertSensitivity, CheckType, MultiHttpSettings } from 'types';
import { fallbackSettings } from 'components/constants';

export const multiHttpFallbackCheck = {
  job: '',
  target: '',
  frequency: 120000,
  timeout: 15000,
  enabled: true,
  labels: [],
  probes: [],
  alertSensitivity: AlertSensitivity.None,
  settings: {
    multihttp: fallbackSettings(CheckType.MULTI_HTTP) as MultiHttpSettings,
  },
  basicMetricsOnly: true,
};
