import { TimeRange } from '@grafana/data';

import { CheckEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { Check } from 'types';
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

export type ViewMode = (typeof TIMEPOINT_EXPLORER_VIEW_OPTIONS)[number]['value'];

export type SelectedTimepoint = [Timepoint, string];

export type SelectedTimepointState = [null, null] | SelectedTimepoint;

export interface TimepointExplorerChild {
  handleTimeRangeToInViewChange: (timeRangeToInView: UnixTimestamp) => void;
  timepoints: Timepoint[];
  timepointDisplayCount: number;
  timeRange: TimeRange;
  viewTimeRangeTo: UnixTimestamp;
  width: number;
  miniMapSections: MinimapSection[];
  isLoading: boolean;
  maxProbeDurationData: number;
  viewMode: ViewMode;
  selectedTimepoint: SelectedTimepointState;
  handleTimepointSelection: (timepoint: Timepoint, probeToView: string) => void;
  check: Check;
}

export interface MinimapSection {
  to: UnixTimestamp;
  from: UnixTimestamp;
  toIndex: number;
  fromIndex: number;
  active: boolean;
}
