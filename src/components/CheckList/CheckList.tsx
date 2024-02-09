import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Pagination, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  Check,
  CheckEnabledStatus,
  CheckFiltersType,
  CheckListViewType,
  CheckSort,
  CheckType,
  FeatureName,
  Label,
  ThresholdSettings,
} from 'types';
import { useChecks } from 'data/useChecks';
import { useThresholds } from 'data/useThresholds';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { defaultFilters, getDefaultFilters } from 'components/CheckFilters';
import {
  CHECK_LIST_STATUS_OPTIONS,
  CHECK_LIST_VIEW_TYPE_LS_KEY,
  CHECKS_PER_PAGE_CARD,
  CHECKS_PER_PAGE_LIST,
} from 'components/constants';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { CheckListItem } from '../CheckListItem';
import { getViewTypeFromLS } from './actions';
import { matchesAllFilters } from './checkFilters';
import { CheckListHeader } from './CheckListHeader';
import { CheckListScene } from './CheckListScene';
import EmptyCheckList from './EmptyCheckList';

export const CheckList = () => {
  const [viewType, setViewType] = useState(getViewTypeFromLS() ?? CheckListViewType.Card);

  const handleChangeViewType = (value: CheckListViewType) => {
    setViewType(value);
    window.localStorage.setItem(CHECK_LIST_VIEW_TYPE_LS_KEY, String(value));
  };

  return (
    <QueryErrorBoundary>
      <CheckListContent onChangeViewType={handleChangeViewType} viewType={viewType} />
    </QueryErrorBoundary>
  );
};

type CheckListContentProps = {
  onChangeViewType: (viewType: CheckListViewType) => void;
  viewType: CheckListViewType;
};

const CheckListContent = ({ onChangeViewType, viewType }: CheckListContentProps) => {
  const { data: checks } = useChecks();
  const {
    data: { thresholds },
  } = useThresholds();
  const [checkFilters, setCheckFilters] = useState<CheckFiltersType>(getDefaultFilters());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCheckIds, setSelectedChecksIds] = useState<Set<number>>(new Set());
  const [sortType, setSortType] = useState<CheckSort>(CheckSort.AToZ);
  const styles = useStyles2(getStyles);
  const { isEnabled: scenesEnabled } = useFeatureFlag(FeatureName.Scenes);
  const checksPerPage = viewType === CheckListViewType.Card ? CHECKS_PER_PAGE_CARD : CHECKS_PER_PAGE_LIST;

  const filteredChecks = filterChecks(checks, checkFilters);
  const sortedChecks = sortChecks(filteredChecks, sortType, thresholds);
  const currentPageChecks = filteredChecks.slice((currentPage - 1) * checksPerPage, currentPage * checksPerPage);

  const isAllSelected = selectedCheckIds.size === filteredChecks.length;
  const totalPages = Math.ceil(filteredChecks.length / checksPerPage);

  const handleResetFilters = () => {
    setCheckFilters(defaultFilters);
    localStorage.removeItem('checkFilters');
  };

  const handleLabelSelect = (label: Label) => {
    setCheckFilters((cf) => {
      const updated = {
        ...cf,
        labels: Array.from(new Set([...cf.labels, `${label.name}: ${label.value}`])),
      };
      localStorage.setItem('checkFilters', JSON.stringify(updated));
      return updated;
    });
    setCurrentPage(1);
  };

  const handleTypeSelect = (checkType: CheckType) => {
    setCheckFilters((cf) => {
      const updated = { ...cf, type: checkType };
      localStorage.setItem('checkFilters', JSON.stringify(updated));
      return updated;
    });
    setCurrentPage(1);
  };

  const handleStatusSelect = (enabled: boolean) => {
    const status = enabled ? CheckEnabledStatus.Enabled : CheckEnabledStatus.Disabled;
    const option = CHECK_LIST_STATUS_OPTIONS.find(({ value }) => value === status);
    if (option) {
      setCheckFilters((cf) => {
        const updated = {
          ...cf,
          status: option,
        };
        localStorage.setItem('checkFilters', JSON.stringify(updated));
        return updated;
      });
      setCurrentPage(1);
    }
  };

  const handleCheckSelect = (checkId: number) => {
    if (!selectedCheckIds.has(checkId)) {
      setSelectedChecksIds(new Set(selectedCheckIds.add(checkId)));
      return;
    }
    selectedCheckIds.delete(checkId);
    setSelectedChecksIds(new Set(selectedCheckIds));
  };

  const updateSortMethod = ({ value }: SelectableValue<CheckSort>) => {
    if (value !== undefined) {
      setSortType(value);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedChecksIds(new Set());
      return;
    }

    const allCheckIds = sortedChecks.map((check) => check.id!);
    setSelectedChecksIds(new Set(allCheckIds));
  };

  const handleChangeViewType = (value: CheckListViewType) => {
    onChangeViewType(value);
    setCurrentPage(1);
  };

  if (checks.length === 0) {
    return <EmptyCheckList />;
  }

  const showHeaders = !scenesEnabled || viewType !== CheckListViewType.Viz;

  return (
    <>
      {showHeaders && (
        <CheckListHeader
          checks={filteredChecks}
          checkFilters={checkFilters}
          currentPageChecks={currentPageChecks}
          onChangeView={handleChangeViewType}
          onFilterChange={setCheckFilters}
          onSelectAll={handleSelectAll}
          onSort={updateSortMethod}
          onReset={handleResetFilters}
          selectedCheckIds={selectedCheckIds}
        />
      )}
      {viewType === CheckListViewType.Viz ? (
        <div className={styles.vizContainer}>
          <CheckListScene
            onChangeViewType={handleChangeViewType}
            checkFilters={checkFilters}
            onFilterChange={(filters: CheckFiltersType) => {
              setCheckFilters(filters);
            }}
            handleResetFilters={handleResetFilters}
          />
        </div>
      ) : (
        <div>
          <section className="card-section card-list-layout-list">
            <div className="card-list">
              {currentPageChecks.map((check, index) => (
                <CheckListItem
                  check={check}
                  key={index}
                  onLabelSelect={handleLabelSelect}
                  onStatusSelect={handleStatusSelect}
                  onTypeSelect={handleTypeSelect}
                  onToggleCheckbox={handleCheckSelect}
                  selected={selectedCheckIds.has(check.id!)}
                  viewType={viewType}
                  onDeleteCheck={() => console.log(check.id)}
                />
              ))}
            </div>
          </section>
          {totalPages > 1 && (
            <Pagination
              numberOfPages={totalPages}
              currentPage={currentPage}
              onNavigate={(toPage: number) => setCurrentPage(toPage)}
            />
          )}
        </div>
      )}
    </>
  );
};

function filterChecks(checks: Check[], filters: CheckFiltersType) {
  return checks.filter((check) => matchesAllFilters(check, filters));
}

function sortChecks(checks: Check[], sortType: CheckSort, thresholds: ThresholdSettings) {
  if (sortType === CheckSort.AToZ) {
    return checks.sort((a, b) => a.job.localeCompare(b.job));
  }

  if (sortType === CheckSort.ZToA) {
    return checks.sort((a, b) => b.job.localeCompare(a.job));
  }

  if (sortType === CheckSort.SuccessRate) {
    // return checks.sort((a, b) => {
    //   const sortA = a.noData ? 101 : a.reachabilityValue;
    //   const sortB = b.noData ? 101 : b.reachabilityValue;
    //   return sortA - sortB;
    // });
  }

  return checks;
}

const getStyles = (theme: GrafanaTheme2) => ({
  vizContainer: css({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    height: 'calc(100% - 100px)',
  }),
});
