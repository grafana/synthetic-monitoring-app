import { TimeRange } from '@grafana/data';

export type UnixTimestamp = number;

export interface TimepointExplorerChild {
  activeSection?: MinimapSection;
  handleTimeRangeToInViewChange: (timeRangeToInView: UnixTimestamp) => void;
  timepointsInRange: UnixTimestamp[];
  timepointDisplayCount: number;
  timeRange: TimeRange;
  viewTimeRangeTo: UnixTimestamp;
  width: number;
  miniMapSections: MinimapSection[];
}

export interface MinimapSection {
  to: UnixTimestamp;
  from: UnixTimestamp;
  toIndex: number;
  fromIndex: number;
  active: boolean;
}
