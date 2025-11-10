import { DateTime } from '@grafana/data';

export enum ProbeStateStatus {
  Pending = 'pending',
  Success = 'success',
  Error = 'error',
  Timeout = 'timeout',
}

interface ProbeState {
  id: number;
  name: string;
  logs: AdHocLogEntry[] | null;
  timeseries: Timeseries[];
  state: ProbeStateStatus;
  public: boolean;
}

export interface AdHocCheckState {
  id: string;
  probeState: Record<string, ProbeState>;
  created: DateTime;
  checkTimeoutInSeconds: number;
}

interface LogBase {
  level: string;
  msg?: string;
  error?: string;
  errorCode?: string;
  time: string;
}

interface AdHocLogEntry extends LogBase {
  ip_protocol?: string;
  target?: string;
  ip?: string;
  host?: string;
  url?: string;
  status_code?: string;
  connectDone?: string;
  dnsDone?: string;
  end?: string;
  gotConn?: string;
  responseStart?: string;
  roundtrip?: string;
  start?: string;
  tlsDone?: string;
  tlsStart?: string;
}

interface ScriptedLogEntry extends LogBase {
  check?: string;
  value?: string;
}

// Vibe coding
interface MetricLabel {
  name: string;
  value: string;
}

interface GaugeMetric {
  gauge: {
    value: number;
  };
  label?: MetricLabel[];
}

interface Timeseries {
  name: string;
  help: string;
  type: number;
  metric: GaugeMetric[];
}

export type LogEntry = AdHocLogEntry | ScriptedLogEntry;

interface AdHocResultLine {
  level: string;
  id: string;
  target: string;
  probe: string;
  check_name: string;
  logs: LogEntry[] | null;
  timeseries: Timeseries[];
  message: string;
}

export interface AdHocResult {
  time: number;
  line: AdHocResultLine;
}

export type AdHocResponseResults = AdHocResult[];
