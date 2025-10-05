import { useQuery } from '@tanstack/react-query';
import { DataFrameJSON } from '@grafana/data';

import { AdHocResponseResults } from './types.adhoc-check';
import { useSMDS } from 'hooks/useSMDS';

export interface LokiQueryResults<RefId extends keyof any = 'A'> {
  results: Record<
    RefId,
    {
      frames: DataFrameJSON[];
      status: number;
    }
  >;
}

export interface UseLogsQueryArgs {
  expr: string;
  from: string | number;
  to?: string | number;
}

enum KnownFieldNames {
  Labels = 'labels',
  Time = 'Time',
  Line = 'Line',
}

function isKnownFieldName(subject: unknown): subject is KnownFieldNames {
  return Object.values(KnownFieldNames).includes(subject as KnownFieldNames);
}
function getFieldIndexMap({ schema = { fields: [] } }: DataFrameJSON) {
  const indexMap: Record<KnownFieldNames, number | null> = {
    [KnownFieldNames.Labels]: null,
    [KnownFieldNames.Time]: null,
    [KnownFieldNames.Line]: null,
  };

  return schema.fields.reduce((acc, field, index) => {
    if (isKnownFieldName(field.name)) {
      acc[field.name] = acc[field.name] = index;
    }
    return acc;
  }, indexMap);
}

export function loggify<RefId extends keyof any = 'A'>(
  result: LokiQueryResults<RefId>,
  refId: RefId = 'A' as RefId
): AdHocResponseResults {
  const refResult = result.results[refId].frames[0];
  const indexMap = getFieldIndexMap(refResult);
  if (indexMap.Time === null) {
    throw new Error('Unexpected DataFrameJSON schema. Field "Time" (frame: "time.Time") not found in schema.');
  }

  return (
    refResult?.data?.values[indexMap.Time].reduce<AdHocResponseResults>((acc, time, index) => {
      let line;
      if (indexMap.Line !== null) {
        line = refResult?.data?.values[indexMap.Line][index];
        try {
          if (typeof line === 'string') {
            line = JSON.parse(line);
          }
        } catch (_error) {
          // Unable to parse line
        }

        acc.push({
          time: time as number,
          line,
        });
      }

      return acc;
    }, []) ?? []
  );
}

export function useAdHocLogs(
  expr?: UseLogsQueryArgs['expr'],
  from: UseLogsQueryArgs['from'] = 'now-5m',
  to?: UseLogsQueryArgs['to'],
  poll = true
) {
  const dataSource = useSMDS();

  return useQuery<AdHocResponseResults>({
    queryKey: ['logs', 'ad-hoc', { expr, from, to }],
    queryFn: async () => {
      return loggify(await dataSource.queryLogsV2(expr!, from, to));
    },
    enabled: !!expr,
    refetchInterval: poll ? 3000 : 0,
  });
}
