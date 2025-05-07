import { TimeRange } from '@grafana/data';

import { CheckEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

export type UnixTimestamp = number;

export type Timepoint = {
  probes: CheckEndedLog[];
  uptimeValue: -1 | 0 | 1; // -1 means unknown, 0 means failure, 1 means success
  adjustedTime: UnixTimestamp;
  frequency: number;
  index: number;
  maxProbeDuration: number;
};

export type TimepointsObj = Record<UnixTimestamp, Timepoint>;

export type ViewMode = (typeof VIEW_OPTIONS)[number]['value'];

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
}

export interface MinimapSection {
  to: UnixTimestamp;
  from: UnixTimestamp;
  toIndex: number;
  fromIndex: number;
  active: boolean;
}
