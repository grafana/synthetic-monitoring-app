import { useQuery } from '@tanstack/react-query';
import { DataFrame } from '@grafana/data';
import { getProbeHealthQuery } from 'queries/probeHealth';

import { UseCheckDrilldownInfoProps } from 'page/CheckDrilldown/checkDrilldown.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { queryMimir } from 'page/CheckDrilldown/utils/queryMimir';
import { toTimeSeries } from 'page/CheckDrilldown/utils/toTimeSeries';

const queryKeys: Record<'checkProbeHealth', string[]> = {
  checkProbeHealth: ['checkProbeHealth'],
};

export function useCheckProbeHealth({ check, timeRange }: UseCheckDrilldownInfoProps) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;

  const { expr, queryType } = getProbeHealthQuery({
    job: check.job,
    instance: check.target,
  });

  const refId = 'CheckProbeHealth';

  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.checkProbeHealth, queryType, expr, url, metricsDS, timeRange, refId],
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
        queryType,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        refId,
      });
    },
    select: (data) => {
      const timeseries = toTimeSeries(data[refId], getLabel);
      const flattendInstant = Object.entries(timeseries).reduce<Record<string, number>>((acc, [probe, results]) => {
        acc[probe] = results[0][1];

        return acc;
      }, {});

      return flattendInstant;
    },
    enabled: !!metricsDS,
  });

  if (!data) {
    return {
      isLoading,
      isError,
      data,
      hasResults: false,
      allProbesRunning: false,
    };
  }

  return {
    isLoading,
    isError,
    data,
    allProbesRunning: Object.keys(data).length === check.probes.length,
  };
}

function getLabel(frame: DataFrame) {
  return frame.fields.find((field) => field.name === 'Value')?.labels?.probe || ``;
}
