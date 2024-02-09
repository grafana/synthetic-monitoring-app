import React, { useState } from 'react';
import { GrafanaTheme2, OrgRole, SelectableValue } from '@grafana/data';
import { Button, Checkbox, Icon, InlineSwitch, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFiltersType, CheckListViewType, CheckSort, FeatureName } from 'types';
import { hasRole } from 'utils';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { CheckFilters } from 'components/CheckFilters';
import { CHECK_LIST_ICON_OVERLAY_LS_KEY, CHECK_LIST_SORT_OPTIONS } from 'components/constants';

import ThresholdGlobalSettings from '../Thresholds/ThresholdGlobalSettings';
import { getIconOverlayToggleFromLS, getViewTypeFromLS } from './actions';
import { AddNewCheckButton } from './AddNewCheckButton';
import { BulkActions } from './BulkActions';
import { CheckListViewSwitcher } from './CheckListViewSwitcher';

type CheckListHeaderProps = {
  checks: Check[];
  checkFilters: CheckFiltersType;
  currentPageChecks: Check[];
  onChangeView: (viewType: CheckListViewType) => void;
  onFilterChange: (filters: CheckFiltersType) => void;
  onSort: (sort: SelectableValue<CheckSort>) => void;
  onReset: () => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCheckIds: Set<number>;
};

export const CheckListHeader = ({
  checkFilters,
  checks,
  currentPageChecks,
  onChangeView,
  onFilterChange,
  onSort,
  onReset,
  onSelectAll,
  selectedCheckIds,
}: CheckListHeaderProps) => {
  const styles = useStyles2(getStyles);
  const { isEnabled: scenesEnabled } = useFeatureFlag(FeatureName.Scenes);
  const viewType = getViewTypeFromLS() ?? CheckListViewType.Card;
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showVizIconOverlay, setShowVizIconOverlay] = useState(getIconOverlayToggleFromLS());
  const isAllSelected = selectedCheckIds.size === checks.length;
  const isSomeSelected = !isAllSelected && selectedCheckIds.size > 0;

  const selectedChecks2 = checks.filter((check) => selectedCheckIds.has(check.id!));

  return (
    <>
      <div className={styles.row}>
        <div>
          {!scenesEnabled ||
            (viewType !== CheckListViewType.Viz && (
              <div>
                Currently showing {currentPageChecks.length} of {checks.length} total checks
              </div>
            ))}
        </div>
        <div className={styles.stack}>
          <CheckFilters
            handleResetFilters={onReset}
            checks={checks}
            checkFilters={checkFilters}
            onChange={onFilterChange}
          />
          {hasRole(OrgRole.Editor) && (
            <>
              <Button variant="secondary" fill="outline" onClick={() => setShowThresholdModal((v) => !v)}>
                Set Thresholds
              </Button>
              <AddNewCheckButton />
            </>
          )}
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.stack}>
          <Checkbox
            onChange={onSelectAll}
            indeterminate={isSomeSelected}
            value={isAllSelected}
            aria-label="Select all"
            data-testid="selectAll"
          />
          {selectedCheckIds.size > 0 ? (
            <BulkActions checks={selectedChecks2} onResolved={onReset} />
          ) : (
            <CheckListViewSwitcher onChange={onChangeView} viewType={viewType} />
          )}
          {!scenesEnabled && viewType === CheckListViewType.Viz && (
            <InlineSwitch
              label="Show icons"
              showLabel
              transparent
              value={showVizIconOverlay}
              onChange={(e) => {
                window.localStorage.setItem(CHECK_LIST_ICON_OVERLAY_LS_KEY, String(e.currentTarget.checked));
                setShowVizIconOverlay(e.currentTarget.checked);
              }}
            />
          )}
        </div>
        <Select
          aria-label="Sort"
          prefix={
            <div>
              <Icon name="sort-amount-down" /> Sort
            </div>
          }
          data-testid="check-list-sort"
          options={CHECK_LIST_SORT_OPTIONS}
          defaultValue={CHECK_LIST_SORT_OPTIONS[0]}
          width={20}
          onChange={onSort}
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
