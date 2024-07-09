import { SelectableValue } from '@grafana/data';

import { Check, CheckEnabledStatus, CheckFiltersType, CheckTypeFilter } from 'types';
import { getCheckType as getCheckType, matchStrings } from 'utils';

const matchesFilterType = (check: Check, typeFilter: CheckTypeFilter) => {
  if (typeFilter === 'all') {
    return true;
  }
  const checkType = getCheckType(check.settings);
  if (checkType === typeFilter) {
    return true;
  }
  return false;
};

const matchesSearchFilter = ({ target, job, labels }: Check, searchFilter: string) => {
  if (!searchFilter) {
    return true;
  }

  // allow users to search using <term>=<somevalue>.
  // <term> can be one of target, job or a label name
  const filterParts = searchFilter.toLowerCase().trim().split('=');

  const labelMatches = labels.reduce((acc, { name, value }) => {
    acc.push(name);
    acc.push(value);
    return acc;
  }, [] as string[]);

  return filterParts.some((filterPart) => matchStrings(filterPart, [target, job, ...labelMatches]));
};

const matchesLabelFilter = ({ labels }: Check, labelFilters: string[]) => {
  if (!labelFilters || labelFilters.length === 0) {
    return true;
  }
  const result = labels?.some(({ name, value }) => {
    const filtersResult = labelFilters.some((filter) => {
      return filter === `${name}: ${value}`;
    });
    return filtersResult;
  });
  return result;
};

const matchesStatusFilter = ({ enabled }: Check, { value }: SelectableValue) => {
  if (
    value === CheckEnabledStatus.All ||
    (value === CheckEnabledStatus.Enabled && enabled) ||
    (value === CheckEnabledStatus.Disabled && !enabled)
  ) {
    return true;
  }
  return false;
};

const matchesSelectedProbes = (check: Check, selectedProbes: SelectableValue[]) => {
  if (selectedProbes.length === 0) {
    return true;
  } else {
    const probeIds = selectedProbes.map((p) => p.value);
    return check.probes.some((id) => probeIds.includes(id));
  }
};

export const matchesAllFilters = (check: Check, checkFilters: CheckFiltersType) => {
  const { type, search, labels, status, probes } = checkFilters;
  return (
    Boolean(check.id) &&
    matchesFilterType(check, type) &&
    matchesSearchFilter(check, search) &&
    matchesLabelFilter(check, labels) &&
    matchesStatusFilter(check, status) &&
    matchesSelectedProbes(check, probes)
  );
};
