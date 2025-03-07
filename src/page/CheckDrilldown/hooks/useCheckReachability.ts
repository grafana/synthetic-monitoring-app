import { useQuery } from '@tanstack/react-query';
import { DataFrame } from '@grafana/data';
import { getReachabilityQuery } from 'queries/reachability';

import { UseCheckDrilldownInfoProps } from 'page/CheckDrilldown/checkDrilldown.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { queryMimir } from 'page/CheckDrilldown/utils/queryMimir';
import { toTimeSeries } from 'page/CheckDrilldown/utils/toTimeSeries';

const queryKeys: Record<'checkReachability', string[]> = {
  checkReachability: ['checkReachability'],
};

export function useCheckReachability({ check, timeRange }: UseCheckDrilldownInfoProps) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;

  const { expr, interval, maxDataPoints } = getReachabilityQuery({
    job: check.job,
    instance: check.target,
    frequency: check.frequency,
  });

  const refId = 'CheckReachability';

  return useQuery({
    queryKey: [
      ...queryKeys.checkReachability,
      expr,
      url,
      metricsDS,
      interval,
      timeRange,
      check.frequency,
      refId,
      maxDataPoints,
    ],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryMimir({
        datasource: {
          uid: metricsDS.uid,
          type: metricsDS.type,
        },
        query: expr,
        interval,
        intervalMs: check.frequency,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        refId,
        maxDataPoints,
      });
    },
    select: (data) => {
      const timeseries = toTimeSeries(data[refId], getLabel) as Record<string, Array<[number, 0 | 1]>>;
      return timeseries;
    },
    enabled: !!metricsDS,
  });
}

function getLabel(frame: DataFrame) {
  return `Reachability`;
}
