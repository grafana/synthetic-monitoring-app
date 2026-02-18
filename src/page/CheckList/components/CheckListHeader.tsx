import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Button, Checkbox, Combobox, Field, Icon, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckFiltersType, CheckListViewType, FilterType } from 'page/CheckList/CheckList.types';
import { Check, CheckSort } from 'types';
import { getUserPermissions } from 'data/permissions';
import { AddNewCheckButton } from 'components/AddNewCheckButton';
import { BulkActions } from 'page/CheckList/components/BulkActions';
import { CheckFilters } from 'page/CheckList/components/CheckFilters';
import { CheckListViewSwitcher } from 'page/CheckList/components/CheckListViewSwitcher';
import { ThresholdGlobalSettings } from 'page/CheckList/components/ThresholdGlobalSettings';

type CheckListHeaderProps = {
  checks: Check[];
  checkFilters: CheckFiltersType;
  currentPageChecks: Check[];
  onChangeView: (viewType: CheckListViewType) => void;
  onDelete: () => void;
  onFilterChange: (filters: CheckFiltersType, type: FilterType) => void;
  onSort: (sort: SelectableValue<CheckSort>) => void;
  onResetFilters: () => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCheckIds: Set<number>;
  sortType: CheckSort;
  viewType: CheckListViewType;
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
  onChangeView,
  onDelete,
  onFilterChange,
  onSort,
  onResetFilters,
  onSelectAll,
  selectedCheckIds,
  sortType,
  viewType,
}: CheckListHeaderProps) => {
  const { canWriteChecks, canWriteThresholds } = getUserPermissions();

  const styles = useStyles2(getStyles);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const hasChecks = checks.length > 0;
  const isAllSelected = !hasChecks ? false : selectedCheckIds.size === checks.length;
  const isSomeSelected = hasChecks && !isAllSelected && selectedCheckIds.size > 0;
  const selectedChecks = checks.filter((check) => selectedCheckIds.has(check.id!));

  const tooltip = isAllSelected ? t('checkList.header.deselectAll', 'Deselect all') : t('checkList.header.selectAll', 'Select all');

  return (
    <>
      <div className={styles.row}>
        <div>
          <Trans i18nKey="checkList.header.currentlyShowing">
            Currently showing {{ currentPageChecksLength: currentPageChecks.length }} of {{ checksLength: checks.length }} total checks
          </Trans>
        </div>
        <Stack alignItems="center" gap={2}>
          <CheckFilters
            onReset={onResetFilters}
            checks={checks}
            checkFilters={checkFilters}
            onChange={onFilterChange}
          />
          {canWriteThresholds && (
            <Button variant="secondary" fill="outline" onClick={() => setShowThresholdModal((v) => !v)}>
              <Trans i18nKey="checkList.header.setThresholds">
                Set Thresholds
              </Trans>
            </Button>
          )}

          {canWriteChecks && <AddNewCheckButton source="check-list" />}
        </Stack>
      </div>
      <div className={styles.row}>
        <Stack alignItems="center" gap={2}>
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
        </Stack>
        <Stack alignItems="center" gap={0.5}>
          <Icon name="sort-amount-down" />
          <Field label={t('checkList.header.sort', 'Sort')} htmlFor="sort-by-select" horizontal data-fs-element="Sort by select" className={styles.field} noMargin>
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
      <ThresholdGlobalSettings onDismiss={() => setShowThresholdModal(false)} isOpen={showThresholdModal} />
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: `flex`,
    justifyContent: `space-between`,
    alignItems: `center`,
    marginBottom: theme.spacing(2),
  }),
  field: css({
    alignItems: 'center',
    gap: theme.spacing(0.5),
    '& > div': {
      marginBottom: 0,
    }
  }),
});
