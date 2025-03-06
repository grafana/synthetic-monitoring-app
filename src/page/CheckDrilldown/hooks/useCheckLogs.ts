import { useQuery } from '@tanstack/react-query';
import { DataFrame } from '@grafana/data';
import { parseLokiLogs } from 'features/parseLogs/parseLokiLogs';

import { CheckLogsSeries } from 'features/parseCheckLogs/checkLogs.types';
import { UseCheckDrilldownInfoProps } from 'page/CheckDrilldown/checkDrilldown.types';
import { useLogsDS } from 'hooks/useLogsDS';
import { queryLoki } from 'page/CheckDrilldown/utils/queryLoki';

const queryKeys: Record<'checkLogs', string[]> = {
  checkLogs: ['checkLogs'],
};

export function useCheckLogs({ check, timeRange }: UseCheckDrilldownInfoProps) {
  const logsDS = useLogsDS();
  const refId = 'CheckLogs';

  return useQuery({
    queryKey: [...queryKeys.checkLogs, check.job, check.target, logsDS, refId],
    queryFn: () => {
      if (!logsDS) {
        return Promise.reject(`You need to have a logs datasource available.`);
      }

      return queryLoki({
        datasource: {
          uid: logsDS.uid,
          type: logsDS.type,
        },
        refId,
        query: `{job=\`${check.job}\`, instance=\`${check.target}\`, probe_success="0"} | logfmt`,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
      });
    },
    select: (data: Record<string, DataFrame[]>) => {
      const frame = data[refId][0] as CheckLogsSeries;

      return parseLokiLogs(frame);
    },
    enabled: !!logsDS,
  });
}
