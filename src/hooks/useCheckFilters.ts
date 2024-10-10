import { SelectableValue } from '@grafana/data';
import { capitalize } from 'lodash';

import { CheckEnabledStatus, CheckType, CheckTypeFilter, ProbeFilter } from 'types';
import { useProbes } from 'data/useProbes';
import { defaultFilters } from 'components/CheckFilters';

import { useQueryParametersState } from './useQueryParametersState';

export type FilterType = 'search' | 'labels' | 'type' | 'status' | 'probes';

interface CheckFiltersProps {
  search: [state: string, update: (value: string | null) => void];
  labels: [state: string[], update: (value: string[] | null) => void];
  type: [state: CheckTypeFilter, update: (value: CheckTypeFilter | null) => void];
  status: [
    state: SelectableValue<CheckEnabledStatus>,
    update: (value: SelectableValue<CheckEnabledStatus> | null) => void
  ];
  probes: [
    state: Array<SelectableValue<ProbeFilter>>,
    update: (value: Array<SelectableValue<ProbeFilter>> | null) => void
  ];
}

export function useCheckFilters() {
  const { data: probes = [] } = useProbes();

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
    probes: useQueryParametersState<Array<SelectableValue<ProbeFilter>>>({
      key: 'probes',
      initialValue: defaultFilters.probes,
      encode: (value) => value.map((probe) => probe.label).join(','),
      decode: (value) => {
        const labels = value.split(',');

        return probes
          .filter((probe) => labels.includes(probe.name))
          .map((probe) => ({ label: probe.name, value: probe.id } as SelectableValue<ProbeFilter>));
      },
    }),
  };

  return filters;
}
