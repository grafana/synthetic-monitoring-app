import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { GrafanaTheme2, SelectableValue, unEscapeStringFromRegex } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Combobox, ComboboxOption, Field, Icon, Input, MultiCombobox, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckAlertsFilter, CheckFiltersType, CheckTypeFilter, FilterType, ProbeFilter } from 'page/CheckList/CheckList.types';
import { Check, FeatureName, GrafanaFolder } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
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
  folders?: GrafanaFolder[];
  defaultFolderUid?: string;
  includeStatus?: boolean;
  className?: string;
}

export function CheckFilters({
  onReset,
  onChange,
  checks,
  checkFilters,
  folders = [],
  defaultFolderUid,
  includeStatus = true,
  className,
}: CheckFiltersProps) {
  const checkTypeOptions = useCheckTypeOptions();
  const filterDesc = checkTypeOptions.map((option) => {
    return {
      label: option.label,
      value: option.value,
    };
  });

  const options: Array<{ label: string; value: CheckTypeFilter }> = [
    {
      label: t('checkFilters.all', 'All'),
      value: 'all',
    },
    ...filterDesc,
  ];

  const alertOptions: Array<ComboboxOption<CheckAlertsFilter>> = [
    { label: t('checkFilters.all', 'All'), value: 'all' },
    { label: t('checkFilters.withAlerts', 'With alerts'), value: 'with' },
    { label: t('checkFilters.withoutAlerts', 'Without alerts'), value: 'without' },
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

  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);

  const folderOptions: Array<ComboboxOption<string>> = useMemo(() => {
    return folders.map((folder) => ({
      label: folder.uid === defaultFolderUid ? `${folder.title} (default)` : folder.title,
      value: folder.uid,
    }));
  }, [folders, defaultFolderUid]);

  return (
    <div className={cx(styles.controls, className)}>
      <div className={styles.searchWrapper}>
        <Input
          autoFocus
          aria-label={t('checkFilters.searchChecksAriaLabel', 'Search checks')}
          prefix={<Icon name="search" />}
          data-testid={DataTestIds.CheckSearchInput}
          type="text"
          value={searchValue ? unEscapeStringFromRegex(searchValue) : ''}
          onChange={handleSearchChange}
          placeholder={t('checkFilters.searchPlaceholder', 'Search by job name, endpoint, or label')}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.filterButtonWrapper}>
        <CheckFilterGroup onReset={onReset} filters={checkFilters}>
          <div className={styles.flexRow}>
            {includeStatus && (
              <Field
                label="Status"
                htmlFor="check-status-filter"
                data-fs-element="Status select"
                className={styles.compactField}
              >
                <Combobox
                  id="check-status-filter"
                  aria-label={t('checkFilters.filterByStatusAriaLabel', 'Filter by status')}
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
            <Field
              label={t('checkFilters.type', 'Type')}
              htmlFor="check-type-filter"
              data-fs-element="Type select"
              className={styles.compactField}
            >
              <Combobox
                aria-label={t('checkFilters.filterByTypeAriaLabel', 'Filter by type')}
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
            <Field
              label={t('checkFilters.alerts', 'Alerts')}
              htmlFor="check-alerts-filter"
              data-fs-element="Alerts select"
              className={styles.compactField}
            >
              <Combobox
                aria-label={t('checkFilters.filterByAlertsAriaLabel', 'Filter by alerts')}
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
          <Field
            label={t('checkFilters.probes', 'Probes')}
            htmlFor="check-probes-filter"
            data-fs-element="Probes select"
            className={cx(styles.verticalSpace, styles.fullWidth)}
          >
            <MultiCombobox
              id="check-probes-filter"
              data-testid={DataTestIds.CheckProbesFilter}
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
              placeholder={t('checkFilters.allProbes', 'All probes')}
              isClearable
            />
          </Field>
          {isFoldersEnabled && (
            <Field
              label={t('checkFilters.folders', 'Folders')}
              htmlFor="check-folder-filter"
              data-fs-element="Folders select"
              className={cx(styles.verticalSpace, styles.fullWidth)}
            >
              <MultiCombobox
                id="check-folder-filter"
                aria-label={t('checkFilters.filterByFolderAriaLabel', 'Filter by folder')}
                onChange={(selectedOptions) => {
                  onChange(
                    {
                      ...checkFilters,
                      folders: selectedOptions.map((opt) => opt.value),
                    },
                    'folder'
                  );
                }}
                options={folderOptions}
                value={checkFilters.folders}
                placeholder={t('checkFilters.allFolders', 'All folders')}
                isClearable
              />
            </Field>
          )}
        </CheckFilterGroup>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  controls: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    minWidth: 0,
  }),
  searchWrapper: css({
    flex: '1 1 320px',
    minWidth: 0,
    maxWidth: '100%',
  }),
  searchInput: css({
    width: '100%',
  }),
  filterButtonWrapper: css({
    flexShrink: 0,
  }),
  flexRow: css({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  }),
  compactField: css({
    marginBottom: 0,
  }),
  verticalSpace: css({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  }),
  fullWidth: css({
    width: '100%',
  }),
});
