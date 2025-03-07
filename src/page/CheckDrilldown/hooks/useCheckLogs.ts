import { useQuery } from '@tanstack/react-query';
import { DataFrame } from '@grafana/data';
import { groupLogs } from 'features/parseCheckLogs/groupLogs';
import { parseLokiLogs } from 'features/parseLogs/parseLokiLogs';

import { CheckLogsSeries } from 'features/parseCheckLogs/checkLogs.types';
import { UseCheckDrilldownInfoProps } from 'page/CheckDrilldown/checkDrilldown.types';
import { useLogsDS } from 'hooks/useLogsDS';
import { queryLoki } from 'page/CheckDrilldown/utils/queryLoki';

const queryKeys: Record<'checkLogs', string[]> = {
  checkLogs: ['checkLogs'],
};

export function useCheckLogs({ check, timeRange, query }: UseCheckDrilldownInfoProps & { query?: string }) {
  const logsDS = useLogsDS();
  const refId = 'CheckLogs';
  const q = query || `{job=\`${check.job}\`, instance=\`${check.target}\`} | logfmt`;

  return useQuery({
    queryKey: [...queryKeys.checkLogs, check.job, check.target, logsDS, refId, timeRange, q],
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
        query: q,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
      });
    },
    select: (data: Record<string, DataFrame[]>) => {
      const frame = data[refId][0] as CheckLogsSeries;
      const parsed = parseLokiLogs(frame);
      const grouped = groupLogs(parsed);

      return grouped;
    },
    enabled: !!logsDS,
  });
}
