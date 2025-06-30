import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Pagination, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getTotalChecksPerMonth } from 'checkUsageCalc';

import { CheckFiltersType, CheckListViewType, FilterType } from 'page/CheckList/CheckList.types';
import { Check, CheckEnabledStatus, CheckSort, CheckType, Label } from 'types';
import { MetricCheckSuccess, Time } from 'datasource/responses.types';
import { useSuspenseChecks } from 'data/useChecks';
import { useSuspenseProbes } from 'data/useProbes';
import { useChecksReachabilitySuccessRate } from 'data/useSuccessRates';
import { findCheckinMetrics } from 'data/utils';
import { useQueryParametersState } from 'hooks/useQueryParametersState';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { CHECK_LIST_STATUS_OPTIONS } from 'page/CheckList/CheckList.constants';
import { useCheckFilters } from 'page/CheckList/CheckList.hooks';
import { matchesAllFilters } from 'page/CheckList/CheckList.utils';
import { CheckListHeader } from 'page/CheckList/components/CheckListHeader';
import { CheckListItem } from 'page/CheckList/components/CheckListItem';
import { CheckListScene } from 'page/CheckList/components/CheckListScene';

const CHECKS_PER_PAGE_CARD = 15;
const CHECKS_PER_PAGE_LIST = 50;

export const CheckList = () => {
  const [viewType, setViewType] = useQueryParametersState<CheckListViewType>({
    key: 'view',
    initialValue: CheckListViewType.Card,
    encode: (value) => value.toString(),
    decode: (value) => value as CheckListViewType,
  });

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
  useSuspenseProbes(); // we need to block rendering until we have the probe list so not to initially render a check list that might have probe filters
  const navigate = useNavigate();
  const location = useLocation();
  const { data: checks } = useSuspenseChecks();
  const { data: reachabilitySuccessRates = [] } = useChecksReachabilitySuccessRate();
  const filters = useCheckFilters();

  const [sortType, setSortType] = useQueryParametersState<CheckSort>({
    key: 'sort',
    initialValue: CheckSort.AToZ,
    encode: (value) => value.toString(),
    decode: (value) => value as CheckSort,
  });

  const [labels, setLabels] = filters.labels;
  const [search, setSearch] = filters.search;
  const [type, setType] = filters.type;
  const [status, setStatus] = filters.status;
  const [probes, setProbes] = filters.probes;

  const checkFilters = useMemo(
    () => ({ labels, search, type, status, probes }),
    [labels, search, type, status, probes]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCheckIds, setSelectedChecksIds] = useState<Set<number>>(new Set());
  const styles = useStyles2(getStyles);
  const CHECKS_PER_PAGE = viewType === CheckListViewType.Card ? CHECKS_PER_PAGE_CARD : CHECKS_PER_PAGE_LIST;

  const filteredChecks = filterChecks(checks, checkFilters);

  const sortedChecks = sortChecks(filteredChecks, sortType, reachabilitySuccessRates);
  const currentPageChecks = sortedChecks.slice((currentPage - 1) * CHECKS_PER_PAGE, currentPage * CHECKS_PER_PAGE);

  const isAllSelected = selectedCheckIds.size === filteredChecks.length;
  const totalPages = Math.ceil(filteredChecks.length / CHECKS_PER_PAGE);

  const handleFilterChange = (filters: CheckFiltersType, type: FilterType) => {
    setCurrentPage(1);

    switch (type) {
      case 'search':
        setSearch(filters.search);
        break;
      case 'labels':
        setLabels(filters.labels);
        break;
      case 'type':
        setType(filters.type);
        break;
      case 'status':
        setStatus(filters.status);
        break;
      case 'probes':
        setProbes(filters.probes);
        break;
      default:
        break;
    }

    setSelectedChecksIds((current) => {
      const filteredChecks = filterChecks(checks, filters);
      const alreadySelectedChecks = filteredChecks.filter((check) => current.has(check.id!)).map((check) => check.id!);
      return new Set(alreadySelectedChecks);
    });
  };

  const handleResetFilters = () => {
    navigate(`${location.pathname}${sortType ? `?sort=${sortType}` : ''}`);
  };

  const handleLabelSelect = (label: Label) => {
    setLabels(Array.from(new Set([...labels, `${label.name}: ${label.value}`])));
  };

  const handleTypeSelect = (checkType: CheckType) => {
    setType(checkType);
  };

  const handleStatusSelect = (enabled: boolean) => {
    const status = enabled ? CheckEnabledStatus.Enabled : CheckEnabledStatus.Disabled;
    const option = CHECK_LIST_STATUS_OPTIONS.find(({ value }: SelectableValue<CheckEnabledStatus>) => value === status);
    if (option) {
      setStatus(option);
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
    return <ChecksEmptyState />;
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
            onFilterChange={handleFilterChange}
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
                  key={check.id}
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

  if ([CheckSort.ReachabilityAsc, CheckSort.ReachabilityDesc].includes(sortType)) {
    const checkWithMetrics = checks.map((check) => {
      const reachabilityMetric = findCheckinMetrics(reachabilitySuccessRates, check);
      const reachability = reachabilityMetric === undefined ? -1 : reachabilityMetric.value[1];

      return {
        ...check,
        reachability,
      };
    });

    return checkWithMetrics.sort((a, b) => {
      if (sortType === CheckSort.ReachabilityAsc) {
        return a.reachability - b.reachability;
      }

      return b.reachability - a.reachability;
    });
  }

  if (sortType === CheckSort.ExecutionsAsc) {
    return checks.sort((a, b) => {
      const [sortA, sortB] = getNumberOfExecutions(a, b);
      return sortA - sortB;
    });
  }

  if (sortType === CheckSort.ExecutionsDesc) {
    return checks.sort((a, b) => {
      const [sortA, sortB] = getNumberOfExecutions(a, b);
      return sortB - sortA;
    });
  }

  return checks;
}

function getNumberOfExecutions(checkA: Check, checkB: Check) {
  const sortA = getTotalChecksPerMonth(checkA.probes.length, checkA.frequency / 1000) || 101;
  const sortB = getTotalChecksPerMonth(checkB.probes.length, checkB.frequency / 1000) || 101;
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
