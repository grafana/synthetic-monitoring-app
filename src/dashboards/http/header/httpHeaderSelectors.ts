import { FieldType, PanelData } from '@grafana/data';
import { selectNumericValue } from 'dashboards/components/CheckDashboardHeader/headerMetricValue';

export interface ExecutionCounts {
  total: number | null;
  successful: number | null;
  failed: number | null;
}

export interface ProbeReachabilityRow {
  probe: string;
  reachability: number;
  failed: number;
}

export function selectExecutionCounts(data: PanelData): ExecutionCounts {
  return {
    total: selectNumericValue(data, 'total'),
    successful: selectNumericValue(data, 'successful'),
    failed: selectNumericValue(data, 'failed'),
  };
}

function valuesByProbe(data: PanelData, refId: string) {
  const values = new Map<string, number>();

  for (const frame of data.series.filter((series) => series.refId === refId)) {
    const probeField = frame.fields.find((field) => field.type === FieldType.string && field.name === 'probe');

    for (const field of frame.fields.filter((field) => field.type === FieldType.number)) {
      for (let index = 0; index < field.values.length; index++) {
        const value = field.values[index];
        const probe = probeField?.values[index] ?? field.labels?.probe ?? frame.name;

        if (typeof probe === 'string' && typeof value === 'number' && Number.isFinite(value)) {
          values.set(probe, value);
        }
      }
    }
  }

  return values;
}

export function selectProbeReachabilityRows(data: PanelData): ProbeReachabilityRow[] {
  const reachability = valuesByProbe(data, 'reachability');
  const failed = valuesByProbe(data, 'failed');

  return Array.from(reachability, ([probe, value]) => ({
    probe,
    reachability: value,
    failed: failed.get(probe) ?? 0,
  })).sort((a, b) => a.reachability - b.reachability || a.probe.localeCompare(b.probe));
}
