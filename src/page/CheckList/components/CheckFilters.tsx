import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { GrafanaTheme2, SelectableValue, unEscapeStringFromRegex } from '@grafana/data';
import { Combobox, ComboboxOption, Field, Icon, Input, MultiCombobox, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

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

  const probesOptions: Array<ComboboxOption<number>> = useMemo(() => {
    return probes
      .filter((probe) => probe.id !== undefined)
      .map((probe) => ({
        label: probe.displayName,
        value: probe.id!,
      }));
  }, [probes]);

  return (
    <>
      <Input
        autoFocus
        aria-label="Search checks"
        prefix={<Icon name="search" />}
        width={40}
        data-testid={CHECKS_TEST_ID.filters.search}
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
                data-testid={CHECKS_TEST_ID.filters.status}
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
              data-testid={CHECKS_TEST_ID.filters.alerts}
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
        <Field label="Probes" htmlFor="check-probes-filter" data-fs-element="Probes select" className={cx(styles.verticalSpace, styles.fullWidth)}>
          <MultiCombobox
            id="check-probes-filter"
            data-testid={CHECKS_TEST_ID.filters.probes}
            onChange={(selectedOptions) => {
              const selectedProbes: ProbeFilter[] = selectedOptions.map((option) => ({
                label: option.label ?? '',
                value: option.value,
              }));
              onChange(
                {
                  ...checkFilters,
                  probes: selectedProbes,
                },
                'probes'
              );
            }}
            options={probesOptions}
            value={checkFilters.probes.map((probe) => probe.value)}
            placeholder="All probes"
            isClearable
          />
        </Field>
      </CheckFilterGroup >
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
  fullWidth: css({
    width: `100%`,
  }),
});
