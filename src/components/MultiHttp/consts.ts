import { CheckType, AlertSensitivity, MultiHttpSettings } from 'types';
import { fallbackSettings } from 'components/constants';

export const multiHttpFallbackCheck = {
  job: '',
  target: '',
  frequency: 120000,
  timeout: 3000,
  enabled: true,
  labels: [],
  probes: [1],
  alertSensitivity: AlertSensitivity.None,
  settings: {
    multihttp: fallbackSettings(CheckType.MULTI_HTTP) as MultiHttpSettings,
  },
  basicMetricsOnly: true,
};
