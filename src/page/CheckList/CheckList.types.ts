import { SelectableValue } from '@grafana/data';
import { ComboboxOption } from '@grafana/ui';

import { Check, CheckEnabledStatus, CheckType, DashboardSceneAppConfig } from 'types';

export enum CheckListViewType {
  Card = 'card',
  List = 'list',
}

export type ProbeFilter = {
  label: string;
  value: number;
};

export type CheckTypeFilter = CheckType | 'all';

export type CheckAlertsFilter = 'all' | 'with' | 'without';

export type FilterType = 'search' | 'labels' | 'type' | 'status' | 'probes' | 'alerts';

export interface CheckFiltersType {
  [key: string]: any;

  search: string;
  labels: string[];
  type: CheckTypeFilter;
  status: ComboboxOption<CheckEnabledStatus>;
  probes: Array<SelectableValue<ProbeFilter>>;
  alerts: CheckAlertsFilter;
}

export interface VizViewSceneAppConfig extends DashboardSceneAppConfig {
  checkFilters: CheckFiltersType;
  checks: Check[];
  onReset: () => void;
  onFilterChange: (filters: CheckFiltersType, type: FilterType) => void;
}
