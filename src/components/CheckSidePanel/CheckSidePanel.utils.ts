import { DataFrameJSON } from '@grafana/data';
import { BadgeColor, IconName } from '@grafana/ui';

import { LokiQueryResults, ProbeState } from './CheckSidePanel.types';

// Constants
export const TIMEOUT_SECONDS = 10;

export const HIGHLIGHT_PATTERNS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  '***SECRET_REDACTED***',
  '302 Found',
  '301 Moved Permanently',
  '200 OK',
];

// Utility functions
export function getProbeSuccess(timeseries: unknown): 'success' | 'error' | null {
  if (!Array.isArray(timeseries)) {
    return null;
  }

  const metric = timeseries.find((item) => item.name === 'probe_success');
  if (!metric) {
    return null;
  }
  return !!metric?.metric?.[0]?.gauge?.value ? 'success' : 'error';
}

export function getStateIcon(state: ProbeState): IconName {
  switch (state) {
    case 'pending':
      return 'fa fa-spinner';
    case 'error':
      return 'bug';
    case 'timeout':
      return 'exclamation-triangle';
    case 'success':
      return 'check-circle';
  }
}

export function getStateColorIndex(state: ProbeState): BadgeColor {
  switch (state) {
    case 'pending':
      // @ts-expect-error This is correct
      return 'darkgrey';
    case 'success':
      return 'green';
    case 'timeout':
      return 'orange';
    case 'error':
      return 'red';
  }
}

// Loki log processing utilities
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
