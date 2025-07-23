import { CheckEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

export type UnixTimestamp = number;

export type Timepoint = {
  probes: CheckEndedLog[];
  uptimeValue: -1 | 0 | 1; // -1 means unknown, 0 means failure, 1 means success
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  frequency: number;
  index: number;
  maxProbeDuration: number;
};

export type StatelessTimepoint = {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  frequency: number;
};

export type StatefulTimepoint = StatelessTimepoint & {
  maxProbeDuration?: number;
  probes?: CheckEndedLog[];
  uptimeValue?: -1 | 0 | 1; // -1 means unknown, 0 means failure, 1 means success
  index: number;
};

export type ViewMode = (typeof TIMEPOINT_EXPLORER_VIEW_OPTIONS)[number]['value'];

export type SelectedTimepoint = [Timepoint, string];

export type SelectedTimepointState = [null, null] | SelectedTimepoint;

export interface MinimapSection {
  to: UnixTimestamp;
  from: UnixTimestamp;
  toIndex: number;
  fromIndex: number;
  index: number;
}

export enum CheckEventType {
  CHECK_CREATED = 'check_created',
  CHECK_UPDATED = 'check_updated',
}

export type CheckEvent = {
  label: CheckEventType;
  from: UnixTimestamp;
  to: UnixTimestamp;
};

export type Annotation = {
  checkEvent: CheckEvent;
  timepointStart: StatelessTimepoint;
  timepointEnd: StatelessTimepoint;
};

export type CheckConfig = {
  frequency: number;
  date: UnixTimestamp;
};
