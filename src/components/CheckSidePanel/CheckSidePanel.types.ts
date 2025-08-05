import { DataFrameJSON,DateTime, IconName } from '@grafana/data';
import { BadgeColor } from '@grafana/ui';

export interface RequestState {
  id: string;
  logs: Array<{
    probe: string;
    logs: Record<string, unknown>;
    state: 'pending' | 'success' | 'error' | 'timeout';
  }>;
  created: DateTime;
}

export interface ProbeStatus {
  name: string;
  state: 'pending' | 'success' | 'error' | 'timeout';
  icon: IconName;
  color: BadgeColor;
  probeSuccess: 'success' | 'error' | 'pending' | 'timeout';
}

export type ProbeState = 'pending' | 'success' | 'error' | 'timeout';

// Loki query types
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
