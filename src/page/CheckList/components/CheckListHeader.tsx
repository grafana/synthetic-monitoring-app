import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Button, Checkbox, Combobox, Field, Icon, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckFiltersType, CheckListViewType, FilterType } from 'page/CheckList/CheckList.types';
import { Check, CheckSort, GrafanaFolder } from 'types';
import { getUserPermissions } from 'data/permissions';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { PlainButton } from 'components/PlainButton';
import { BulkActions } from 'page/CheckList/components/BulkActions';
import { CheckFilters } from 'page/CheckList/components/CheckFilters';
import { CheckListViewSwitcher } from 'page/CheckList/components/CheckListViewSwitcher';
import { ThresholdGlobalSettings } from 'page/CheckList/components/ThresholdGlobalSettings';

type CheckListHeaderProps = {
  checks: Check[];
  checkFilters: CheckFiltersType;
  currentPageChecks: Check[];
  folders?: GrafanaFolder[];
  defaultFolderUid?: string;
  onChangeView: (viewType: CheckListViewType) => void;
  onDelete: () => void;
  onFilterChange: (filters: CheckFiltersType, type: FilterType) => void;
  onSort: (sort: SelectableValue<CheckSort>) => void;
  onResetFilters: () => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCheckIds: Set<number>;
  sortType: CheckSort;
  viewType: CheckListViewType;
  alertStatesFetching: boolean;
  alertStatesError: boolean;
  onRetryAlertStates: () => void;
  calNames?: string[];
};

const CHECK_LIST_SORT_OPTIONS = [
  {
    label: 'A-Z',
    value: CheckSort.AToZ,
  },
  {
    label: 'Z-A',
    value: CheckSort.ZToA,
  },
  {
    label: t('checkList.header.sortOptions.ascReachability', 'Asc. Reachability'),
    value: CheckSort.ReachabilityAsc,
  },
  {
    label: t('checkList.header.sortOptions.descReachability', 'Desc. Reachability'),
    value: CheckSort.ReachabilityDesc,
  },
  {
    label: t('checkList.header.sortOptions.ascExecutions', 'Asc. Executions'),
    value: CheckSort.ExecutionsAsc,
  },
  {
    label: t('checkList.header.sortOptions.descExecutions', 'Desc. Executions'),
    value: CheckSort.ExecutionsDesc,
  },
];

export const CheckListHeader = ({
  checkFilters,
  checks,
  currentPageChecks,
  folders,
  defaultFolderUid,
  onChangeView,
  onDelete,
  onFilterChange,
  onSort,
  onResetFilters,
  onSelectAll,
  selectedCheckIds,
  sortType,
  viewType,
  alertStatesFetching,
  alertStatesError,
  onRetryAlertStates,
  calNames,
}: CheckListHeaderProps) => {
  const { canWriteChecks, canWriteThresholds } = getUserPermissions();

  const styles = useStyles2(getStyles);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const hasChecks = checks.length > 0;
  const isAllSelected = !hasChecks ? false : selectedCheckIds.size === checks.length;
  const isSomeSelected = hasChecks && !isAllSelected && selectedCheckIds.size > 0;
  const selectedChecks = checks.filter((check) => selectedCheckIds.has(check.id!));

  const tooltip = isAllSelected
    ? t('checkList.header.deselectAll', 'Deselect all')
    : t('checkList.header.selectAll', 'Select all');

  return (
    <>
      <div className={styles.header}>
        <div className={styles.row}>
          <div className={styles.summary}>
            <Trans i18nKey="checkList.header.currentlyShowing">
              Currently showing {{ currentPageChecksLength: currentPageChecks.length }} of{' '}
              {{ checksLength: checks.length }} total checks
            </Trans>
          </div>
          <div className={styles.primaryActions}>
            <CheckFilters
              onReset={onResetFilters}
              checks={checks}
              checkFilters={checkFilters}
              folders={folders}
              defaultFolderUid={defaultFolderUid}
              onChange={onFilterChange}
              calNames={calNames}
              className={styles.filters}
            />
            {canWriteThresholds && (
              <Button variant="secondary" fill="outline" onClick={() => setShowThresholdModal((v) => !v)}>
                <Trans i18nKey="checkList.header.setThresholds">Set Thresholds</Trans>
              </Button>
            )}
            {canWriteChecks && (
              <div className={styles.createButton}>
                <AddNewCheckButton source="check-list" />
              </div>
            )}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.secondaryActions}>
            <Tooltip content={tooltip}>
              <Checkbox
                onChange={onSelectAll}
                indeterminate={isSomeSelected}
                value={isAllSelected}
                disabled={checks.length === 0}
                aria-label={t('checkList.header.selectAllAriaLabel', 'Select all')}
                data-testid={DataTestIds.SelectAllChecks}
              />
            </Tooltip>
            {selectedCheckIds.size > 0 ? (
              <BulkActions checks={selectedChecks} onResolved={onDelete} />
            ) : (
              <CheckListViewSwitcher onChange={onChangeView} viewType={viewType} />
            )}
          </div>

          <div className={styles.supportingContent}>
            {alertStatesFetching && (
              <Stack alignItems="center" gap={1}>
                <Icon name="fa fa-spinner" />
                <span>Fetching alert states</span>
              </Stack>
            )}
            {alertStatesError && !alertStatesFetching && (
              <PlainButton onClick={onRetryAlertStates} className={styles.errorButton}>
                <Stack alignItems="center" gap={1}>
                  <Icon name="exclamation-triangle" />
                  <span>Failed to fetch alert states. Retry?</span>
                </Stack>
              </PlainButton>
            )}
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Icon name="sort-amount-down" />
              <Field
                label="Sort"
                htmlFor="sort-by-select"
                horizontal
                data-fs-element="Sort by select"
                className={styles.field}
                noMargin
              >
                <Combobox
                  id="sort-by-select"
                  data-testid={DataTestIds.SortChecksByCombobox}
                  options={CHECK_LIST_SORT_OPTIONS}
                  width={25}
                  onChange={onSort}
                  value={sortType}
                />
              </Field>
            </Stack>
          </div>
        </div>
      </div>
      <ThresholdGlobalSettings onDismiss={() => setShowThresholdModal(false)} isOpen={showThresholdModal} />
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = 'check-list-header';
  const containerQuery = `@container ${containerName} (max-width: ${theme.breakpoints.values.lg}px)`;

  return {
    header: css({
      containerName,
      containerType: 'inline-size',
    }),
    row: css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(2),
    }),
    summary: css({
      flex: '1 1 240px',
      minWidth: 0,
    }),
    primaryActions: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
      flex: '999 1 640px',
      minWidth: 0,
      [containerQuery]: {
        justifyContent: 'flex-start',
        width: '100%',
      },
    }),
    filters: css({
      flex: '1 1 420px',
      minWidth: 0,
    }),
    createButton: css({
      flexShrink: 0,
    }),
    errorButton: css({
      color: theme.colors.error.text,
    }),
    secondaryActions: css({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
      minWidth: 0,
    }),
    supportingContent: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
      minWidth: 0,
      marginLeft: 'auto',
      [containerQuery]: {
        marginLeft: 0,
        width: '100%',
      },
    }),
    sortGroup: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    }),
    field: css({
      alignItems: 'center',
      gap: theme.spacing(0.5),
      '& > div': {
        marginBottom: 0,
      },
    }),
  };
};
