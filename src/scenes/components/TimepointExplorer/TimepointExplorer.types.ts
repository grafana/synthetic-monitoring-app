import { CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

export type UnixTimestamp = number;

export type StatelessTimepoint = {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  frequency: number;
};

export type ViewMode = (typeof TIMEPOINT_EXPLORER_VIEW_OPTIONS)[number]['value'];

export type SelectedTimepoint = [StatelessTimepoint, string];

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

export interface ExecutionsInTimepoint {
  probe: string;
  execution: ParsedLokiRecord<CheckLabels & EndingLogLabels, CheckLabelType>;
  id: string;
}

export interface StatefulTimepoint {
  adjustedTime: UnixTimestamp;
  timepointDuration: number;
  frequency: number;
  uptimeValue: -1 | 0 | 1;
  executions: ExecutionsInTimepoint[];
  maxProbeDuration: number;
}
