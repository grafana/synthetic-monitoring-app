import { TimeRange } from '@grafana/data';

import { Check } from 'types';

export type UseCheckDrilldownInfoProps = {
  check: Check;
  timeRange: TimeRange;
};

export type Timeseries = {
  uptime: Array<[number, 0 | 1]>;
  probeDuration: Record<string, Array<[number, number]>>;
  probeSuccess: Record<string, Array<[number, 0 | 1]>>;
};
