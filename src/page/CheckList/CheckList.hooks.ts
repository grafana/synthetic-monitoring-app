import { SelectableValue } from '@grafana/data';
import { capitalize } from 'lodash';

import { CheckAlertsFilter, CheckTypeFilter, ProbeFilter } from 'page/CheckList/CheckList.types';
import { CheckEnabledStatus, CheckType } from 'types';
import { useProbesWithMetadata } from 'data/useProbes';
import { useQueryParametersState } from 'hooks/useQueryParametersState';
import { defaultFilters } from 'page/CheckList/CheckList.utils';

interface CheckFiltersProps {
  search: [state: string, update: (value: string | null) => void];
  labels: [state: string[], update: (value: string[] | null) => void];
  type: [state: CheckTypeFilter, update: (value: CheckTypeFilter | null) => void];
  alerts: [state: CheckAlertsFilter, update: (value: CheckAlertsFilter | null) => void];
  status: [
    state: SelectableValue<CheckEnabledStatus>,
    update: (value: SelectableValue<CheckEnabledStatus> | null) => void
  ];
  probes: [
    state: ProbeFilter[],
    update: (value: ProbeFilter[] | null) => void
  ];
}

export function useCheckFilters() {
  const { data: probes = [] } = useProbesWithMetadata();

  const filters: CheckFiltersProps = {
    search: useQueryParametersState<string>({
      key: 'search',
      initialValue: defaultFilters.search,
      encode: (value) => value,
      decode: (value) => value,
    }),
    labels: useQueryParametersState<string[]>({
      key: 'labels',
      initialValue: defaultFilters.labels,
      encode: (value) => value.join(','),
      decode: (value) => value.split(','),
    }),
    type: useQueryParametersState<CheckTypeFilter>({
      key: 'type',
      initialValue: defaultFilters.type,
      encode: (value) => value,
      decode: (value) => {
        const availableTypes = Object.values(CheckType).map((type) => type.toLowerCase());
        if (availableTypes.includes(value.toLowerCase())) {
          return value as CheckTypeFilter;
        }
        return 'all';
      },
    }),
    alerts: useQueryParametersState<CheckAlertsFilter>({
      key: 'alerts',
      initialValue: defaultFilters.alerts,
      encode: (value) => value,
      decode: (value) => {
        const allowed: CheckAlertsFilter[] = ['all', 'with', 'without'];
        if (allowed.includes(value as CheckAlertsFilter)) {
          return value as CheckAlertsFilter;
        }
        return 'all';
      },
    }),
    status: useQueryParametersState<SelectableValue<CheckEnabledStatus>>({
      key: 'status',
      initialValue: defaultFilters.status,
      encode: (value) => value.value || '',
      decode: (value) => {
        if (Object.values(CheckEnabledStatus).includes(value as CheckEnabledStatus)) {
          return { label: capitalize(value), value: value as CheckEnabledStatus };
        }
        return { label: capitalize(CheckEnabledStatus.All), value: CheckEnabledStatus.All };
      },
    }),
    probes: useQueryParametersState<ProbeFilter[]>({
      key: 'probes',
      initialValue: defaultFilters.probes,
      encode: (value) => value.map((probe) => probe.label).join(','),
      decode: (value) => {
        const labels = value.split(',');

        return probes
          .filter((probe) => labels.includes(probe.displayName))
          .map((probe) => ({ label: probe.displayName, value: probe.id } as ProbeFilter));
      },
    }),
  };

  return filters;
}
