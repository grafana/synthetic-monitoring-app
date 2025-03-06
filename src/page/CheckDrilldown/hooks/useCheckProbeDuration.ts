import { useQuery } from '@tanstack/react-query';
import { DataFrame } from '@grafana/data';
import { getProbeDurationQuery } from 'queries/probeDuration';

import { UseCheckDrilldownInfoProps } from 'page/CheckDrilldown/checkDrilldown.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { queryMimir } from 'page/CheckDrilldown/utils/queryMimir';
import { toTimeSeries } from 'page/CheckDrilldown/utils/toTimeSeries';

const queryKeys: Record<'checkProbeDuration', string[]> = {
  checkProbeDuration: ['checkProbeDuration'],
};

export function useCheckProbeDuration({ check, timeRange }: UseCheckDrilldownInfoProps) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;

  const { expr, interval } = getProbeDurationQuery({
    job: check.job,
    instance: check.target,
    frequency: check.frequency,
  });

  const refId = 'CheckProbeDuration';

  return useQuery({
    queryKey: [...queryKeys.checkProbeDuration, expr, url, metricsDS, interval, timeRange, check.frequency, refId],
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
      });
    },
    select: (data) => {
      const timeseries = toTimeSeries(data[refId], getLabel);
      return timeseries;
    },
    enabled: !!metricsDS,
  });
}

function getLabel(frame: DataFrame) {
  return frame.fields.find((field) => field.name === 'Value')?.labels?.probe || ``;
}
