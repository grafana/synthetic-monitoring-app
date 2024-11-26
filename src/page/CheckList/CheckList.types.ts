import { SelectableValue } from '@grafana/data';

import { Check, CheckEnabledStatus, CheckType, DashboardSceneAppConfig } from 'types';

export enum CheckListViewType {
  Card = 'card',
  List = 'list',
  Viz = 'viz',
}

export type ProbeFilter = {
  label: string;
  value: number;
};

export type CheckTypeFilter = CheckType | 'all';

export type FilterType = 'search' | 'labels' | 'type' | 'status' | 'probes';

export interface CheckFiltersType {
  [key: string]: any;

  search: string;
  labels: string[];
  type: CheckTypeFilter;
  status: SelectableValue<CheckEnabledStatus>;
  probes: Array<SelectableValue<ProbeFilter>>;
}

export interface VizViewSceneAppConfig extends DashboardSceneAppConfig {
  checkFilters: CheckFiltersType;
  checks: Check[];
  onReset: () => void;
  onFilterChange: (filters: CheckFiltersType, type: FilterType) => void;
}
