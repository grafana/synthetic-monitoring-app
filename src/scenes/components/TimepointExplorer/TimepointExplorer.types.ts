import { ExecutionEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import {
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  VIZ_DISPLAY_OPTIONS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

export type UnixTimestamp = number;

export type StatelessTimepoint = {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  index: number;
  config: CheckConfig;
};

export interface StatefulTimepoint {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  status: TimepointStatus;
  probeResults: ProbeResults;
  maxProbeDuration: number;
  index: number;
  config: CheckConfig;
}

export type ViewMode = (typeof TIMEPOINT_EXPLORER_VIEW_OPTIONS)[number]['value'];

type ProbeName = string;
type ExecutionIndex = number;

export type SelectedTimepoint = [StatelessTimepoint, ProbeName, ExecutionIndex];

export type ViewerState = SelectedTimepoint | [];
export type HoveredState = SelectedTimepoint | [];

export type MiniMapSection = [number, number];
export type MiniMapSections = [MiniMapSection, ...MiniMapSection[]];

export type MiniMapPage = [number, number];
export type MiniMapPages = [MiniMapPage, ...MiniMapPage[]];

export enum CheckEventType {
  CHECK_CREATED = 'Check created',
  CHECK_UPDATED = 'Check updated',
  BEFORE_CREATION = 'Before check was created',
  OUT_OF_TIMERANGE = 'Out of selected timerange',
  OUT_OF_RETENTION_PERIOD = 'Out of retention period',
  ALERTS_FIRING = 'Alerts firing',
  ALERTS_PENDING = 'Alerts pending',
  NO_DATA = 'No data',
}

export type CheckEvent = {
  label: CheckEventType;
  from: UnixTimestamp | null;
  to: UnixTimestamp | null;
  color: string;
};

export type CheckConfigType = 'no-data';

export type CheckConfigRaw = {
  frequency: number;
  date: UnixTimestamp;
  type?: CheckConfigType;
};

export type CheckConfig = {
  frequency: number;
  from: UnixTimestamp;
  to: UnixTimestamp;
  type?: CheckConfigType;
};

export type ProbeResults = Record<string, ExecutionEndedLog[]>;

export type TimepointStatus = (typeof VIZ_DISPLAY_OPTIONS)[number];

export type VizDisplay = TimepointStatus[];

export type TimepointVizOption = {
  border: string;
  backgroundColor: string;
  textColor: string;
  statusColor: string;
};

export type TimepointVizOptions = Record<TimepointStatus, TimepointVizOption>;
