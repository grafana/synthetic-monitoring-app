import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Pagination, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckEnabledStatus, CheckFiltersType, CheckListViewType, CheckSort, CheckType, Label } from 'types';
import { MetricCheckSuccess, Time } from 'datasource/responses.types';
import { useSuspenseChecks } from 'data/useChecks';
import { useChecksReachabilitySuccessRate } from 'data/useSuccessRates';
import { findCheckinMetrics } from 'data/utils';
import useQueryParametersState from 'hooks/useQueryParametersState';
import { defaultFilters, getDefaultFilters } from 'components/CheckFilters';
import { CHECK_LIST_STATUS_OPTIONS, CHECKS_PER_PAGE_CARD, CHECKS_PER_PAGE_LIST } from 'components/constants';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { CheckListItem } from '../CheckListItem';
import { matchesAllFilters } from './checkFilters';
import { CheckListHeader } from './CheckListHeader';
import { CheckListScene } from './CheckListScene';
import EmptyCheckList from './EmptyCheckList';

export const CheckList = () => {
  const [viewType, setViewType] = useQueryParametersState<number>('viewType', CheckListViewType.Card);

  const handleChangeViewType = (value: CheckListViewType) => {
    setViewType(value);
  };

  return (
    <PluginPage>
      <QueryErrorBoundary>
        <CheckListContent onChangeViewType={handleChangeViewType} viewType={viewType} />
      </QueryErrorBoundary>
    </PluginPage>
  );
};

type CheckListContentProps = {
  onChangeViewType: (viewType: CheckListViewType) => void;
  viewType: CheckListViewType;
};

const CheckListContent = ({ onChangeViewType, viewType }: CheckListContentProps) => {
  const { data: checks } = useSuspenseChecks();
  const { data: reachabilitySuccessRates = [] } = useChecksReachabilitySuccessRate();
  const [checkFilters, setCheckFilters] = useQueryParametersState<CheckFiltersType>(
    'checkFilters',
    getDefaultFilters()
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCheckIds, setSelectedChecksIds] = useState<Set<number>>(new Set());
  const [sortType, setSortType] = useState<CheckSort>(CheckSort.AToZ);
  const styles = useStyles2(getStyles);
  const CHECKS_PER_PAGE = viewType === CheckListViewType.Card ? CHECKS_PER_PAGE_CARD : CHECKS_PER_PAGE_LIST;

  const filteredChecks = filterChecks(checks, checkFilters);
  const sortedChecks = sortChecks(filteredChecks, sortType, reachabilitySuccessRates);
  const currentPageChecks = filteredChecks.slice((currentPage - 1) * CHECKS_PER_PAGE, currentPage * CHECKS_PER_PAGE);

  const isAllSelected = selectedCheckIds.size === filteredChecks.length;
  const totalPages = Math.ceil(filteredChecks.length / CHECKS_PER_PAGE);

  const handleFilterChange = (filters: CheckFiltersType) => {
    setCurrentPage(1);
    setCheckFilters(filters);

    setSelectedChecksIds((current) => {
      const filteredChecks = filterChecks(checks, filters);
      const alreadySelectedChecks = filteredChecks.filter((check) => current.has(check.id!)).map((check) => check.id!);
      return new Set(alreadySelectedChecks);
    });
  };

  const handleResetFilters = () => {
    handleFilterChange(defaultFilters);
    setCheckFilters(null);
  };

  const handleLabelSelect = (label: Label) => {
    const updated = {
      ...checkFilters,
      labels: Array.from(new Set([...checkFilters.labels, `${label.name}: ${label.value}`])),
    };

    handleFilterChange(updated);
  };

  const handleTypeSelect = (checkType: CheckType) => {
    const updated = { ...checkFilters, type: checkType };

    handleFilterChange(updated);
  };

  const handleStatusSelect = (enabled: boolean) => {
    const status = enabled ? CheckEnabledStatus.Enabled : CheckEnabledStatus.Disabled;
    const option = CHECK_LIST_STATUS_OPTIONS.find(({ value }) => value === status);

    if (option) {
      const updated = {
        ...checkFilters,
        status: option,
      };
      handleFilterChange(updated);
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
      return handleUnselectAll();
    }

    const allCheckIds = sortedChecks.map((check) => check.id!);
    setSelectedChecksIds(new Set(allCheckIds));
  };

  const handleChangeViewType = (value: CheckListViewType) => {
    onChangeViewType(value);
    setCurrentPage(1);
  };

  const handleUnselectAll = () => {
    setSelectedChecksIds(new Set());
  };

  if (checks.length === 0) {
    return <EmptyCheckList />;
  }

  const showHeaders = viewType !== CheckListViewType.Viz;

  return (
    <>
      {showHeaders && (
        <CheckListHeader
          checks={filteredChecks}
          checkFilters={checkFilters}
          currentPageChecks={currentPageChecks}
          onChangeView={handleChangeViewType}
          onFilterChange={handleFilterChange}
          onSelectAll={handleSelectAll}
          onSort={updateSortMethod}
          onResetFilters={handleResetFilters}
          onDelete={handleUnselectAll}
          selectedCheckIds={selectedCheckIds}
          sortType={sortType}
          viewType={viewType}
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
            onReset={handleResetFilters}
          />
        </div>
      ) : (
        <div>
          <section className="card-section card-list-layout-list">
            <div className={styles.list}>
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

type MetricCheckSuccessParsed = MetricCheckSuccess & {
  value: [Time, number];
};

function sortChecks(checks: Check[], sortType: CheckSort, reachabilitySuccessRates: MetricCheckSuccessParsed[]) {
  if (sortType === CheckSort.AToZ) {
    return checks.sort((a, b) => a.job.localeCompare(b.job));
  }

  if (sortType === CheckSort.ZToA) {
    return checks.sort((a, b) => b.job.localeCompare(a.job));
  }

  if (sortType === CheckSort.ReachabilityAsc) {
    return checks.sort((a, b) => {
      const [sortA, sortB] = getMetricValues(a, b, reachabilitySuccessRates);
      return sortB - sortA;
    });
  }

  if (sortType === CheckSort.ReachabilityDesc) {
    return checks.sort((a, b) => {
      const [sortA, sortB] = getMetricValues(a, b, reachabilitySuccessRates);

      return sortA - sortB;
    });
  }

  return checks;
}

function getMetricValues(checkA: Check, checkB: Check, metrics: MetricCheckSuccessParsed[]) {
  const metricA = findCheckinMetrics(metrics, checkA);
  const metricB = findCheckinMetrics(metrics, checkB);

  const sortA = metricA?.value[1] || 101;
  const sortB = metricB?.value[1] || 101;

  return [sortA, sortB];
}

const getStyles = (theme: GrafanaTheme2) => ({
  list: css({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: theme.spacing(1),
  }),
  vizContainer: css({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    height: 'calc(100% - 100px)',
  }),
});
