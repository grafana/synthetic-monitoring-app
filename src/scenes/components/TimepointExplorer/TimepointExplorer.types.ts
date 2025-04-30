import { TimeRange } from '@grafana/data';

import { CheckEndedLog } from 'features/parseCheckLogs/checkLogs.types';

export type UnixTimestamp = number;

export type Timepoint = Record<string, CheckEndedLog & { frequency: number; adjustedTime: UnixTimestamp }>;

export type Timepoints = Record<UnixTimestamp, Timepoint>;

export interface TimepointExplorerChild {
  activeSection?: MinimapSection;
  handleTimeRangeToInViewChange: (timeRangeToInView: UnixTimestamp) => void;
  timepoints: Timepoints;
  timepointDisplayCount: number;
  timeRange: TimeRange;
  viewTimeRangeTo: UnixTimestamp;
  width: number;
  miniMapSections: MinimapSection[];
  isLoading: boolean;
  maxProbeDurationData: number | undefined;
}

export interface MinimapSection {
  to: UnixTimestamp;
  from: UnixTimestamp;
  toIndex: number;
  fromIndex: number;
  active: boolean;
}
