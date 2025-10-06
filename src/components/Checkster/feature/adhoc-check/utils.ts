import { AdHocResult, ProbeStateStatus } from './types.adhoc-check';

import { UPGRADED_LOG_MESSAGE } from './constants';

function getTimeseriesMetric(name: string, timeseries: AdHocResult['line']['timeseries'] = []) {
  return timeseries.find((item) => item.name === name);
}

export function getProbeSuccess(state: ProbeStateStatus, timeseries?: AdHocResult['line']['timeseries']) {
  if (state !== ProbeStateStatus.Success) {
    return state;
  }

  const metric = getTimeseriesMetric('probe_success', timeseries);

  if (!metric) {
    return state;
  }

  const [gauge] = metric.metric;
  return gauge.gauge.value === 1 ? ProbeStateStatus.Success : ProbeStateStatus.Error;
}

export function getLogLevelFromMessage(message: string, defaultLevel = 'log') {
  for (const subject of UPGRADED_LOG_MESSAGE) {
    if (Array.isArray(subject)) {
      const [subjectMessage, level] = subject;
      if (message.startsWith(subjectMessage)) {
        return level;
      }
    } else if (message.startsWith(subject)) {
      return 'error';
    }
  }

  return defaultLevel.toLowerCase();
}
