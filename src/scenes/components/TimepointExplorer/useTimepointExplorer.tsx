import { useQuery } from '@tanstack/react-query';
import { DataFrame, TimeRange } from '@grafana/data';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useTimepointsInRange } from 'scenes/components/TimepointExplorer/useTimepointsInRange';

interface UseTimepointExplorerProps {
  timeRange: TimeRange;
  check: Check;
}

export function useTimepointExplorer({ timeRange, check }: UseTimepointExplorerProps) {
  const { data = [] } = useCheckConfigs({ timeRange, check });
  const timepointsInRange = useTimepointsInRange({
    from: timeRange.from.toDate(),
    to: timeRange.to.toDate(),
    checkConfigs: data,
  });

  return {
    timepointsInRange,
  };
}

function useCheckConfigs({ timeRange, check }: UseTimepointExplorerProps) {
  const metricsDS = useMetricsDS();
  const { expr, queryType } = getCheckConfigsQuery({ job: check.job, instance: check.target });
  const refId = 'uniqueCheckConfigs';

  return useQuery({
    queryKey: ['uniqueCheckConfigs', metricsDS, expr, timeRange, queryType, refId],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject('No metrics data source found');
      }

      return queryMimir({
        datasource: metricsDS,
        query: expr,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        refId,
        queryType,
      });
    },
    select: (data) => {
      const res = data[refId];
      return extractFrequenciesAndConfigs(res);
    },
  });
}

function extractFrequenciesAndConfigs(data: DataFrame[]) {
  let build: Array<{ frequency: number; date: Date }> = [];

  for (const frame of data) {
    const Value = frame.fields[1];

    if (Value.labels) {
      const { config_version, frequency } = Value.labels;
      const toNumber = Number(config_version) / 1000000;
      const date = new Date(toNumber);

      build.push({
        frequency: Number(frequency),
        date,
      });
    }
  }

  return build;
}
