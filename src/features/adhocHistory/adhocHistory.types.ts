// Labels of a list query record: the stream labels plus the fields extracted with `| json`. Loki
// only sets an extracted label when the field exists in the line, so every field is optional.
export interface AdHocHistoryListLabels {
  probe: string;
  source: string;
  type: string;
  id?: string;
  target?: string;
  check_name?: string;
  job?: string;
  client_type?: string;
  success?: string;
  duration_seconds?: string;
  probes_requested?: string;
}

export interface AdHocHistoryProbeResult {
  probe: string;
  time: number;
  // undefined for result lines published by agents that predate the run metadata
  success?: boolean;
  durationSeconds?: number;
}

export interface AdHocHistoryRun {
  id: string;
  // time of the first and last probe result of the run
  time: number;
  lastTime: number;
  target: string;
  checkType: string;
  job?: string;
  clientType?: string;
  probesRequested?: number;
  probes: AdHocHistoryProbeResult[];
}

export type AdHocRunStatus = 'passed' | 'failed' | 'unknown';

export interface AdHocRunSummary {
  status: AdHocRunStatus;
  passed: number;
  total: number;
  // requested probes that never published a result
  missing: number;
}
