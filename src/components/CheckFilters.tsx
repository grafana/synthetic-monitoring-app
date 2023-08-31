import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue, unEscapeStringFromRegex } from '@grafana/data';
import { AsyncMultiSelect, Icon, Input, Select, useStyles2 } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import { debounce } from 'lodash';
import React, { useCallback, useContext, useState } from 'react';
import { Check, CheckFiltersType } from 'types';
import CheckFilterGroup from './CheckList/CheckFilterGroup';
import { fetchProbeOptions } from './CheckList/actions';
import { LabelFilterInput } from './LabelFilterInput';
import { CHECK_FILTER_OPTIONS, CHECK_LIST_STATUS_OPTIONS } from './constants';

const getStyles = (theme: GrafanaTheme2) => ({
  flexRow: css`
    display: flex;
    flex-direction: row;
  `,
  marginRightSmall: css`
    margin-right: ${theme.spacing(2)};
  `,
  verticalSpace: css`
    margin-top: 10px;
    margin-bottom: 10px;
    margin-right: ${theme.spacing(2)};
  `,
});

interface Props {
  handleResetFilters: () => void;
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

export function CheckFilters({
  handleResetFilters,
  onChange,
  checks,
  checkFilters = defaultFilters,
  includeStatus = true,
}: Props) {
  const styles = useStyles2(getStyles);
  const [searchValue, setSearchValue] = useState(checkFilters.search);
  const { instance } = useContext(InstanceContext);

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
        className={styles.marginRightSmall}
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
      <CheckFilterGroup onReset={handleResetFilters} filters={checkFilters}>
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
                // setCheckFilters((cf: CheckFiltersType) => {
                const updated = {
                  ...checkFilters,
                  status: option,
                };
                onChange(updated);
                // return updated;
                // });
              }}
              value={checkFilters.status}
            />
          )}
          <Select
            aria-label="Filter by type"
            prefix="Types"
            data-testid="check-type-filter"
            options={CHECK_FILTER_OPTIONS}
            className={styles.verticalSpace}
            width={20}
            onChange={(selected: SelectableValue) => {
              // setCheckFilters((cf: CheckFiltersType) => {
              const updated = {
                ...checkFilters,
                type: selected?.value ?? checkFilters.type,
              };
              onChange(updated);
              // return updated;
              // });
            }}
            value={checkFilters.type}
          />
        </div>
        <LabelFilterInput
          checks={checks}
          onChange={(labels) => {
            // setCheckFilters((cf: CheckFiltersType) => {
            const updated = {
              ...checkFilters,
              labels,
            };
            onChange(updated);
            // return updated;
            // });
          }}
          labelFilters={checkFilters.labels}
          className={styles.verticalSpace}
        />
        <AsyncMultiSelect
          aria-label="Filter by probe"
          data-testid="probe-filter"
          prefix="Probes"
          onChange={(v) => {
            // setCheckFilters((cf: CheckFiltersType) => {
            const updated = {
              ...checkFilters,
              probes: v,
            };
            onChange(updated);
            // return updated;
            // });
          }}
          defaultOptions
          loadOptions={() => fetchProbeOptions(instance)}
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
