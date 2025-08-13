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

export type VizDisplayValue = (typeof VIZ_DISPLAY_OPTIONS)[number];
export type VizDisplay = VizDisplayValue[];

export type ViewMode = (typeof TIMEPOINT_EXPLORER_VIEW_OPTIONS)[number]['value'];

export type SelectedTimepoint = [StatelessTimepoint, string];

export type SelectedTimepointState = [null, null] | SelectedTimepoint;

export type MiniMapSection = [number, number];
export type MiniMapSections = [MiniMapSection, ...MiniMapSection[]];

export type MiniMapPage = [number, number];
export type MiniMapPages = [MiniMapPage, ...MiniMapPage[]];

export enum CheckEventType {
  CHECK_CREATED = 'Check created',
  CHECK_UPDATED = 'Check updated',
  OUT_OF_TIMERANGE = 'Out of selected timerange',
  OUT_OF_RETENTION_PERIOD = 'Out of retention period',
  FAKE_RANGE_RENDERING_CHECK = 'Fake range rendering check',
  ALERTS_FIRING = 'Alerts firing',
  ALERTS_PENDING = 'Alerts pending',
  NO_DATA = 'No data',
}

export type CheckEvent = {
  label: CheckEventType;
  from: UnixTimestamp;
  to: UnixTimestamp;
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

export interface ExecutionsInTimepoint {
  probe: string;
  execution: ExecutionEndedLog;
  id: string; // id'd by using the log id of the ending log
}

export interface StatefulTimepoint {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  uptimeValue: -1 | 0 | 1 | 2; // -1: unknown, 0: failure, 1: success, 2: pending
  executions: ExecutionsInTimepoint[];
  maxProbeDuration: number;
  index: number;
  config: CheckConfig;
}
