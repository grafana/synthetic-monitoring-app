import { Check, CheckEnabledStatus } from 'types';
import { CheckFilters } from './CheckList';

import { SelectableValue } from '@grafana/data';
import { checkType as getCheckType, matchStrings } from 'utils';

export const matchesFilterType = (check: Check, typeFilter: string) => {
  if (typeFilter === 'all') {
    return true;
  }
  const checkType = getCheckType(check.settings);
  if (checkType === typeFilter) {
    return true;
  }
  return false;
};

export const matchesSearchFilter = ({ target, job, labels }: Check, searchFilter: string) => {
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

export const matchesLabelFilter = ({ labels }: Check, labelFilters: string[]) => {
  if (labelFilters.length === 0) {
    return true;
  }
  return labels.some(({ name, value }) => labelFilters.some((filter) => filter === `${name}: ${value}`));
};

export const matchesStatusFilter = ({ enabled }: Check, { value }: SelectableValue) => {
  if (
    value === CheckEnabledStatus.All ||
    (value === CheckEnabledStatus.Enabled && enabled) ||
    (value === CheckEnabledStatus.Disabled && !enabled)
  ) {
    return true;
  }
  return false;
};

export const matchesSelectedProbes = (check: Check, selectedProbes: SelectableValue[]) => {
  if (selectedProbes.length === 0) {
    return true;
  } else {
    const probeIds = selectedProbes.map((p) => p.value);
    return check.probes.some((id) => probeIds.includes(id));
  }
};

export const matchesAllFilters = (check: Check, checkFilters: CheckFilters) => {
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
