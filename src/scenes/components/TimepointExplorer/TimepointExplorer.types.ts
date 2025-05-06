import { TimeRange } from '@grafana/data';

import { CheckEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

export type UnixTimestamp = number;

export type Timepoint = Record<
  string,
  CheckEndedLog & { frequency: number; adjustedTime: UnixTimestamp; probe: string }
>;

export type Timepoints = Record<UnixTimestamp, Timepoint>;

export type ViewMode = (typeof VIEW_OPTIONS)[number]['value'];

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
  viewMode: ViewMode;
}

export interface MinimapSection {
  to: UnixTimestamp;
  from: UnixTimestamp;
  toIndex: number;
  fromIndex: number;
  active: boolean;
}
