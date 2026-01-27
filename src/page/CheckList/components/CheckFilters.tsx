import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { GrafanaTheme2, SelectableValue, unEscapeStringFromRegex } from '@grafana/data';
import { Combobox, ComboboxOption, Field, Icon, Input, MultiSelect, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckAlertsFilter, CheckFiltersType, CheckTypeFilter, FilterType, ProbeFilter } from 'page/CheckList/CheckList.types';
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

  const alertOptions: Array<ComboboxOption<CheckAlertsFilter>> = [
    { label: 'All', value: 'all' },
    { label: 'With alerts', value: 'with' },
    { label: 'Without alerts', value: 'without' },
  ];

  const styles = useStyles2(getStyles);
  const [searchValue, setSearchValue] = useState(checkFilters.search);
  const [probes] = useExtendedProbes();
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
        data-testid={DataTestIds.CheckSearchInput}
        type="text"
        value={searchValue ? unEscapeStringFromRegex(searchValue) : ''}
        onChange={handleSearchChange}
        placeholder="Search by job name, endpoint, or label"
      />
      <CheckFilterGroup onReset={onReset} filters={checkFilters}>
        <div className={styles.flexRow}>
          {includeStatus && (
            <Field label="Status" htmlFor="check-status-filter" data-fs-element="Status select" className={css({
              marginBottom: 0,
            })}>
              <Combobox
                id="check-status-filter"
                aria-label="Filter by status"
                data-testid={DataTestIds.CheckStatusFilter}
                options={CHECK_LIST_STATUS_OPTIONS}
                width={20}
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
            </Field>
          )}
          <Field label="Type" htmlFor="check-type-filter" data-fs-element="Type select" className={css({
            marginBottom: 0,
          })}>
            <Combobox
              aria-label="Filter by type"
              id="check-type-filter"
              options={options}
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
          </Field>
          <Field label="Alerts" htmlFor="check-alerts-filter" data-fs-element="Alerts select" className={css({
            marginBottom: 0,
          })}>
            <Combobox
              aria-label="Filter by alerts"
              id="check-alerts-filter"
              data-testid={DataTestIds.CheckAlertsFilter}
              options={alertOptions}
              width={20}
              onChange={(option) => {
                onChange(
                  {
                    ...checkFilters,
                    alerts: option?.value ?? checkFilters.alerts,
                  },
                  'alerts'
                );
              }}
              value={checkFilters.alerts}
            />
          </Field>
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
        {/* eslint-disable-next-line @typescript-eslint/no-deprecated */}
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
