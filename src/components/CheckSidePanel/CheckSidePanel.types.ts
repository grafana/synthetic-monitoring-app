import { DateTime } from '@grafana/data';

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
  icon: string;
  color: string;
  probeSuccess: 'success' | 'error' | 'pending' | 'timeout';
}

export type ProbeState = 'pending' | 'success' | 'error' | 'timeout'; 
