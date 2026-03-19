export interface SyntheticChecksPanelTimeRange {
  from: number;
  to: number;
}

export interface SyntheticChecksPanelProps {
  urls: string[];
  timeRange?: SyntheticChecksPanelTimeRange;
  title?: string;
  showSeeAllLink?: boolean;
  pageSize?: number;
}
