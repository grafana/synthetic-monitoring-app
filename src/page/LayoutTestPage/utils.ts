import { DataFrameJSON } from '@grafana/data';

import { LokiQueryResults } from './types';

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

export function loggify<RefId extends keyof any = 'A'>(result: LokiQueryResults<RefId>, refId: RefId = 'A' as RefId) {
  const refResult = result.results[refId].frames[0];
  const indexMap = getFieldIndexMap(refResult);
  if (indexMap.Time === null) {
    throw new Error('Unexpected DataFrameJSON schema. Field "Time" (frame: "time.Time") not found in schema.');
  }

  return (
    refResult?.data?.values[indexMap.Time].reduce<Array<Record<string, unknown>>>((acc, time, index) => {
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
          time,
          line,
        });
      }

      return acc;
    }, []) ?? []
  );
}
