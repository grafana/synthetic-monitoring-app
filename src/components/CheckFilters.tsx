import React, { useCallback, useState } from 'react';
import { GrafanaTheme2, SelectableValue, unEscapeStringFromRegex } from '@grafana/data';
import { Icon, Input, MultiSelect, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { debounce } from 'lodash';

import { Check, CheckFiltersType } from 'types';
import { useProbes } from 'data/useProbes';

import CheckFilterGroup from './CheckList/CheckFilterGroup';
import { CHECK_FILTER_OPTIONS, CHECK_LIST_STATUS_OPTIONS } from './constants';
import { LabelFilterInput } from './LabelFilterInput';

const getStyles = (theme: GrafanaTheme2) => ({
  flexRow: css`
    display: flex;
    flex-direction: row;
  `,
  verticalSpace: css`
    margin-top: 10px;
    margin-bottom: 10px;
  `,
});

interface Props {
  onReset: () => void;
  onChange: (filters: CheckFiltersType) => void;
  checks: Check[];
  checkFilters?: CheckFiltersType;
  includeStatus?: boolean;
}

export const defaultFilters: CheckFiltersType = {
  search: '',
  labels: [],
  type: 'all',
  status: CHECK_LIST_STATUS_OPTIONS[0],
  probes: [],
};

export const getDefaultFilters = (): CheckFiltersType => {
  const storedFilters = localStorage.getItem('checkFilters');
  if (storedFilters) {
    try {
      return JSON.parse(storedFilters) as CheckFiltersType;
    } catch (e) {
      return defaultFilters;
    }
  }
  return defaultFilters;
};

export function CheckFilters({
  onReset,
  onChange,
  checks,
  checkFilters = defaultFilters,
  includeStatus = true,
}: Props) {
  const styles = useStyles2(getStyles);
  const [searchValue, setSearchValue] = useState(checkFilters.search);
  const { data: probes = [] } = useProbes();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(debounce(onChange, 1000), []);

  function handleSearchChange(event: any) {
    const value = event.currentTarget?.value;
    setSearchValue(value);
    debouncedOnChange({ ...checkFilters, search: value });
  }

  return (
    <>
      <Input
        autoFocus
        aria-label="Search checks"
        prefix={<Icon name="search" />}
        width={40}
        data-testid="check-search-input"
        type="text"
        value={searchValue ? unEscapeStringFromRegex(searchValue) : ''}
        onChange={handleSearchChange}
        placeholder="Search by job name, endpoint, or label"
      />
      <CheckFilterGroup onReset={onReset} filters={checkFilters}>
        <div className={styles.flexRow}>
          {includeStatus && (
            <Select
              prefix="Status"
              aria-label="Filter by status"
              data-testid="check-status-filter"
              options={CHECK_LIST_STATUS_OPTIONS}
              width={20}
              className={styles.verticalSpace}
              onChange={(option) => {
                onChange({
                  ...checkFilters,
                  status: option,
                });
              }}
              value={checkFilters.status}
            />
          )}
          <Select
            aria-label="Filter by type"
            prefix="Types"
            options={CHECK_FILTER_OPTIONS}
            className={styles.verticalSpace}
            width={20}
            onChange={(selected: SelectableValue) => {
              onChange({
                ...checkFilters,
                type: selected?.value ?? checkFilters.type,
              });
            }}
            value={checkFilters.type}
          />
        </div>
        <LabelFilterInput
          checks={checks}
          onChange={(labels) => {
            onChange({
              ...checkFilters,
              labels,
            });
          }}
          labelFilters={checkFilters.labels}
          className={styles.verticalSpace}
        />
        <MultiSelect
          aria-label="Filter by probe"
          prefix="Probes"
          onChange={(v) => {
            onChange({
              ...checkFilters,
              probes: v,
            });
          }}
          options={probes.map((p) => ({ label: p.name, value: p.id }))}
          value={checkFilters.probes}
          placeholder="All probes"
          allowCustomValue={false}
          isSearchable={true}
          isClearable={true}
          closeMenuOnSelect={false}
          className={styles.verticalSpace}
        />
      </CheckFilterGroup>
    </>
  );
}
