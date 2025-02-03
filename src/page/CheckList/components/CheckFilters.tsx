import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { GrafanaTheme2, SelectableValue, unEscapeStringFromRegex } from '@grafana/data';
import { Icon, Input, MultiSelect, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFiltersType, CheckTypeFilter, FilterType, ProbeFilter } from 'page/CheckList/CheckList.types';
import { Check } from 'types';
import { useExtendedProbes } from 'data/useProbes';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { CHECK_LIST_STATUS_OPTIONS } from 'page/CheckList/CheckList.constants';
import { CheckFilterGroup } from 'page/CheckList/components/CheckFilterGroup';
import { LabelFilterInput } from 'page/CheckList/components/LabelFilterInput';

interface CheckFiltersProps {
  onReset: () => void;
  onChange: (filters: CheckFiltersType, type: FilterType) => void;
  checks: Check[];
  checkFilters: CheckFiltersType;
  includeStatus?: boolean;
}

export function CheckFilters({ onReset, onChange, checks, checkFilters, includeStatus = true }: CheckFiltersProps) {
  const checkTypeOptions = useCheckTypeOptions();
  const filterDesc = checkTypeOptions.map((option) => {
    return {
      label: option.label,
      value: option.value,
    };
  });

  const options: Array<{ label: string; value: CheckTypeFilter }> = [
    {
      label: 'All',
      value: 'all',
    },
    ...filterDesc,
  ];

  const styles = useStyles2(getStyles);
  const [searchValue, setSearchValue] = useState(checkFilters.search);
  const [probes] = useExtendedProbes();
  const debounceRef = useRef<NodeJS.Timeout>();

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    setSearchValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        onChange({ ...checkFilters, search: value }, 'search');
      }
    }, 300);
  }

  const probesOptions: Array<SelectableValue<ProbeFilter>> = useMemo(() => {
    return probes.map((probe) => {
      const probeOption: SelectableValue = { label: probe.displayName, value: probe.id };
      return probeOption;
    });
  }, [probes]);

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
                onChange(
                  {
                    ...checkFilters,
                    status: option,
                  },
                  'status'
                );
              }}
              value={checkFilters.status}
            />
          )}
          <Select
            aria-label="Filter by type"
            prefix="Types"
            options={options}
            className={styles.verticalSpace}
            width={20}
            onChange={(selected: SelectableValue) => {
              onChange(
                {
                  ...checkFilters,
                  type: selected?.value ?? checkFilters.type,
                },
                'type'
              );
            }}
            value={checkFilters.type}
          />
        </div>
        <LabelFilterInput
          checks={checks}
          onChange={(labels) => {
            onChange(
              {
                ...checkFilters,
                labels,
              },
              'labels'
            );
          }}
          labelFilters={checkFilters.labels}
          className={styles.verticalSpace}
        />
        <MultiSelect
          aria-label="Filter by probe"
          prefix="Probes"
          onChange={(v) => {
            onChange(
              {
                ...checkFilters,
                probes: v,
              },
              'probes'
            );
          }}
          options={probesOptions}
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

const getStyles = (theme: GrafanaTheme2) => ({
  flexRow: css({
    display: `flex`,
    flexDirection: `row`,
  }),
  verticalSpace: css({
    marginTop: `10px`,
    marginTottom: `10px`,
  }),
});
