import { ExecutionEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import {
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  VIZ_DISPLAY_OPTIONS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

export type UnixTimestamp = number;

export type StatelessTimepoint = {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  frequency: number;
  index: number;
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
  CHECK_CREATED = 'check_created',
  CHECK_UPDATED = 'check_updated',
  OUT_OF_TIMERANGE = 'out_of_timerange',
  FAKE_RANGE_RENDERING_CHECK = 'fake_range_rendering_check',
}

export type CheckEvent = {
  label: CheckEventType;
  from: UnixTimestamp;
  to: UnixTimestamp;
  offset?: boolean;
};

export type CheckConfig = {
  frequency: number;
  date: UnixTimestamp;
};

export interface ExecutionsInTimepoint {
  probe: string;
  execution: ExecutionEndedLog;
  id: string; // id'd by using the log id of the ending log
}

export interface StatefulTimepoint {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  frequency: number;
  uptimeValue: -1 | 0 | 1 | 2; // -1: unknown, 0: failure, 1: success, 2: pending
  executions: ExecutionsInTimepoint[];
  maxProbeDuration: number;
  index: number;
}
