import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Checkbox, Icon, Select, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFiltersType, CheckListViewType, CheckSort } from 'types';
import { FilterType } from 'hooks/useCheckFilters';
import { getUserPermissions } from 'hooks/useUserPermissions';
import { CheckFilters } from 'components/CheckFilters';
import { CHECK_LIST_SORT_OPTIONS } from 'components/constants';

import { ThresholdGlobalSettings } from '../Thresholds/ThresholdGlobalSettings';
import { AddNewCheckButton } from './AddNewCheckButton';
import { BulkActions } from './BulkActions';
import { CheckListViewSwitcher } from './CheckListViewSwitcher';

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

  const tooltip = isAllSelected ? 'Deselect all' : 'Select all';

  return (
    <>
      <div className={styles.row}>
        <div>
          {viewType !== CheckListViewType.Viz && (
            <div>
              Currently showing {currentPageChecks.length} of {checks.length} total checks
            </div>
          )}
        </div>
        <div className={styles.stack}>
          <CheckFilters
            onReset={onResetFilters}
            checks={checks}
            checkFilters={checkFilters}
            onChange={onFilterChange}
          />
          {canWriteThresholds && (
            <Button variant="secondary" fill="outline" onClick={() => setShowThresholdModal((v) => !v)}>
              Set Thresholds
            </Button>
          )}

          {canWriteChecks && <AddNewCheckButton />}
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.stack}>
          <Tooltip content={tooltip}>
            <Checkbox
              onChange={onSelectAll}
              indeterminate={isSomeSelected}
              value={isAllSelected}
              disabled={checks.length === 0}
              aria-label="Select all"
              data-testid="selectAll"
            />
          </Tooltip>
          {selectedCheckIds.size > 0 ? (
            <BulkActions checks={selectedChecks} onResolved={onDelete} />
          ) : (
            <CheckListViewSwitcher onChange={onChangeView} viewType={viewType} />
          )}
        </div>
        <Select
          aria-label="Sort checks by"
          prefix={
            <div>
              <Icon name="sort-amount-down" /> Sort
            </div>
          }
          options={CHECK_LIST_SORT_OPTIONS}
          defaultValue={CHECK_LIST_SORT_OPTIONS[0]}
          width={25}
          onChange={onSort}
          value={sortType}
        />
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
  stack: css({
    alignItems: `center`,
    display: `flex`,
    gap: theme.spacing(2),
  }),
});
