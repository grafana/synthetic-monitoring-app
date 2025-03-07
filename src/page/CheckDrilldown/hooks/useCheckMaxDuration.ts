import { useQuery } from '@tanstack/react-query';
import { DataFrame } from '@grafana/data';
import { getMaxDurationByCheck } from 'queries/maxDurationByCheck';

import { UseCheckDrilldownInfoProps } from 'page/CheckDrilldown/checkDrilldown.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { queryMimir } from 'page/CheckDrilldown/utils/queryMimir';
import { toTimeSeries } from 'page/CheckDrilldown/utils/toTimeSeries';

const queryKeys: Record<'checkMaxDuration', string[]> = {
  checkMaxDuration: ['checkMaxDuration'],
};

export function useCheckMaxDuration({ check, timeRange }: UseCheckDrilldownInfoProps) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;

  const { expr, queryType } = getMaxDurationByCheck({
    job: check.job,
    instance: check.target,
  });

  const refId = 'CheckMaxDuration';

  return useQuery({
    queryKey: [...queryKeys.checkMaxDuration, expr, url, metricsDS, timeRange, check.frequency, refId, queryType],
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
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        refId,
        queryType,
      });
    },
    select: (data) => {
      const timeseries = toTimeSeries(data[refId], getLabel);
      const maxDuration = timeseries.maxDuration[0][1];

      return maxDuration;
    },
    enabled: !!metricsDS,
  });
}

function getLabel(frame: DataFrame) {
  return `maxDuration`;
}
