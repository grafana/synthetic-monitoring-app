import { TimeRange } from '@grafana/data';

export interface TimepointExplorerChild {
  handleTimeRangeToInViewChange: (timeRangeToInView: Date) => void;
  timepointsInRange: Date[];
  timepointsToDisplay: number;
  timeRange: TimeRange;
  viewTimeRangeTo: Date;
  width: number;
  miniMapSections: MinimapSection[];
}

export interface MinimapSection {
  to: Date;
  from: Date;
  index: number;
  timepoints: Date[];
}
