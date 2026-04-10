import React, { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { locationService, PluginPage } from '@grafana/runtime';
import { Pagination, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getTotalChecksPerMonth } from 'checkUsageCalc';

import { CheckFiltersType, CheckListViewType, FilterType } from 'page/CheckList/CheckList.types';
import { Check, CheckEnabledStatus, CheckSort, CheckType, FeatureName, Label } from 'types';
import { MetricCheckSuccess, Time } from 'datasource/responses.types';
import { CheckFolderAccessValueProvider } from 'contexts/CheckFolderAccessContext';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import {
  CheckRuntimeAlertStates,
  getCheckCompositeKey,
  getCheckRuntimeAlertState,
  useChecksAlertStates,
} from 'data/useCheckAlertStates';
import { useSuspenseChecks } from 'data/useChecks';
import { useAllFolders } from 'data/useFolders';
import { useSuspenseProbes } from 'data/useProbes';
import { useChecksReachabilitySuccessRate } from 'data/useSuccessRates';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useQueryParametersState } from 'hooks/useQueryParametersState';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import {
  CHECK_LIST_STATUS_OPTIONS,
  CHECKS_PER_PAGE_CARD,
  CHECKS_PER_PAGE_LIST,
} from 'page/CheckList/CheckList.constants';
import { useCheckFilters } from 'page/CheckList/CheckList.hooks';
import { matchesAllFilters } from 'page/CheckList/CheckList.utils';
import { CheckListFolderView } from 'page/CheckList/components/CheckListFolderView';
import { CheckListHeader } from 'page/CheckList/components/CheckListHeader';
import { CheckListItem } from 'page/CheckList/components/CheckListItem';

export const CheckList = () => {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const [viewType, setViewType] = useQueryParametersState<CheckListViewType>({
    key: 'view',
    initialValue: isFoldersEnabled ? CheckListViewType.Folder : CheckListViewType.Card,
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
  const location = useLocation();
  const { data: checks } = useSuspenseChecks();

  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { folders: allFolders, foldersMap, defaultFolderUid, isLoading: isFoldersLoading, isError: isFoldersError, refetch: refetchFolders } = useAllFolders();
  const {
    data: checkAlertStates = {},
    isFetched: isAlertStatesFetched,
    isFetching: isAlertStatesFetching,
    isError: isAlertStatesError,
    refetch: refetchAlertStates,
  } = useChecksAlertStates(checks);
  const { data: reachabilitySuccessRates = [] } = useChecksReachabilitySuccessRate();
  const [applyAlertSort, setApplyAlertSort] = useState(false);
  const filters = useCheckFilters();
  const { isEnabled: isCALsEnabled } = useFeatureFlag(FeatureName.CALs);
  const { data: calData } = useTenantCostAttributionLabels();
  const calNames = useMemo(() => (isCALsEnabled ? calData?.names ?? [] : []), [isCALsEnabled, calData?.names]);

  // Animate the initial alert-based reorder only once, when alert states first arrive.
  // Subsequent refetches re-sort silently to avoid distracting repeated animations.
  useEffect(() => {
    if (!isAlertStatesFetched || applyAlertSort) {
      return;
    }

    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        flushSync(() => setApplyAlertSort(true));
      });
    } else {
      setApplyAlertSort(true);
    }
  }, [isAlertStatesFetched, applyAlertSort]);

  const [sortType, setSortType] = useQueryParametersState<CheckSort>({
    key: 'sort',
    initialValue: CheckSort.AToZ,
    encode: (value) => value.toString(),
    decode: (value) => value as CheckSort,
  });

  const [labels, setLabels] = filters.labels;
  const [search, setSearch] = filters.search;
  const [type, setType] = filters.type;
  const [alerts, setAlerts] = filters.alerts;
  const [status, setStatus] = filters.status;
  const [probes, setProbes] = filters.probes;
  const [folders, setFolders] = filters.folders;

  const checkFiltersWithStatus: CheckFiltersType = useMemo(
    () => ({
      labels,
      search,
      type,
      alerts,
      status:
        status.value !== undefined
          ? ({ label: status.label, value: status.value } as CheckFiltersType['status'])
          : CHECK_LIST_STATUS_OPTIONS[0],
      probes,
      folders: isFoldersEnabled ? folders : [],
    }),
    [labels, search, type, alerts, status, probes, folders, isFoldersEnabled]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCheckIds, setSelectedChecksIds] = useState<Set<number>>(new Set());
  const styles = useStyles2(getStyles);
  const CHECKS_PER_PAGE = viewType === CheckListViewType.Card ? CHECKS_PER_PAGE_CARD : CHECKS_PER_PAGE_LIST;

  const filteredChecks = filterChecks(checks, checkFiltersWithStatus, defaultFolderUid);
  const sortedChecks = sortChecks(filteredChecks, sortType, reachabilitySuccessRates, checkAlertStates, applyAlertSort);
  const folderAccess = useCheckFolderAccess(sortedChecks);
  const { visibleChecks } = folderAccess;

  const currentPageChecks = visibleChecks.slice((currentPage - 1) * CHECKS_PER_PAGE, currentPage * CHECKS_PER_PAGE);
  const totalPages = Math.ceil(visibleChecks.length / CHECKS_PER_PAGE);

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
      case 'alerts':
        setAlerts(filters.alerts);
        break;
      case 'status':
        setStatus(filters.status);
        break;
      case 'probes':
        setProbes(filters.probes);
        break;
      case 'folders':
        setFolders(filters.folders);
        break;
      default:
        break;
    }

    setSelectedChecksIds((current) => {
      const filteredChecks = filterChecks(checks, filters, defaultFolderUid);
      const alreadySelectedChecks = filteredChecks.filter((check) => current.has(check.id!)).map((check) => check.id!);
      return new Set(alreadySelectedChecks);
    });
  };

  const handleResetFilters = () => {
    locationService.push(`${location.pathname}${sortType ? `?sort=${sortType}` : ''}`);
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

  const isAllSelected = selectedCheckIds.size === visibleChecks.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      return handleUnselectAll();
    }
    const allCheckIds = visibleChecks.map((check) => check.id!);
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

  return (
    <CheckFolderAccessValueProvider value={folderAccess}>
      <CheckListHeader
        checks={visibleChecks}
        checkFilters={checkFiltersWithStatus}
        currentPageChecks={currentPageChecks}
        folders={allFolders}
        defaultFolderUid={defaultFolderUid}
        onChangeView={handleChangeViewType}
        onFilterChange={handleFilterChange}
        onSelectAll={handleSelectAll}
        onSort={updateSortMethod}
        onResetFilters={handleResetFilters}
        onDelete={handleUnselectAll}
        selectedCheckIds={selectedCheckIds}
        sortType={sortType}
        viewType={viewType}
        alertStatesFetching={isAlertStatesFetching}
        alertStatesError={isAlertStatesError}
        onRetryAlertStates={refetchAlertStates}
        calNames={calNames}
      />
      {viewType === CheckListViewType.Folder ? (
        <CheckListFolderView
          checks={visibleChecks}
          folders={allFolders}
          foldersMap={foldersMap}
          foldersLoading={isFoldersLoading}
          foldersError={isFoldersError}
          onRetryFolders={refetchFolders}
          defaultFolderUid={defaultFolderUid}
          checkAlertStates={checkAlertStates}
          calNames={calNames}
          onLabelSelect={handleLabelSelect}
          onStatusSelect={handleStatusSelect}
          onTypeSelect={handleTypeSelect}
          onToggleCheckbox={handleCheckSelect}
          selectedCheckIds={selectedCheckIds}
        />
      ) : (
        <div>
          <section className="card-section card-list-layout-list">
            <div className={styles.list}>
              {currentPageChecks.map((check) => (
                <div key={check.id} style={{ viewTransitionName: `check-${check.id}` }}>
                <CheckListItem
                  check={check}
                  calNames={calNames}
                  onLabelSelect={handleLabelSelect}
                  onStatusSelect={handleStatusSelect}
                  onTypeSelect={handleTypeSelect}
                  onToggleCheckbox={handleCheckSelect}
                  runtimeAlertState={getCheckRuntimeAlertState(checkAlertStates, check)}
                  selected={selectedCheckIds.has(check.id!)}
                  viewType={viewType}
                />
                </div>
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
    </CheckFolderAccessValueProvider>
  );
};

function filterChecks(checks: Check[], filters: CheckFiltersType, defaultFolderUid?: string) {
  return checks.filter((check) => matchesAllFilters(check, filters, defaultFolderUid));
}

type MetricCheckSuccessParsed = MetricCheckSuccess & {
  value: [Time, number];
};

function sortChecks(
  checks: Check[],
  sortType: CheckSort,
  reachabilitySuccessRates: MetricCheckSuccessParsed[],
  checkAlertStates: CheckRuntimeAlertStates,
  applyAlertSort: boolean
) {
  const reachabilityMap = reachabilitySuccessRates.reduce<Record<string, number>>((acc, metric) => {
    acc[getCheckCompositeKey(metric.metric.job, metric.metric.instance)] = metric.value[1];
    return acc;
  }, {});

  return [...checks].sort((a, b) => {
    if (applyAlertSort) {
      const alertStateComparison = compareAlertState(a, b, checkAlertStates);

      if (alertStateComparison !== 0) {
        return alertStateComparison;
      }
    }

    const selectedSortComparison = compareChecksBySortType(a, b, sortType, reachabilityMap);

    if (selectedSortComparison !== 0) {
      return selectedSortComparison;
    }

    return a.job.localeCompare(b.job);
  });
}

function getNumberOfExecutions(checkA: Check, checkB: Check) {
  const sortA = getTotalChecksPerMonth(checkA.probes.length, checkA.frequency / 1000) || 101;
  const sortB = getTotalChecksPerMonth(checkB.probes.length, checkB.frequency / 1000) || 101;
  return [sortA, sortB];
}

function compareAlertState(checkA: Check, checkB: Check, checkAlertStates: CheckRuntimeAlertStates) {
  const isAFiring = getCheckRuntimeAlertState(checkAlertStates, checkA).firingCount > 0;
  const isBFiring = getCheckRuntimeAlertState(checkAlertStates, checkB).firingCount > 0;

  if (isAFiring === isBFiring) {
    return 0;
  }

  return isAFiring ? -1 : 1;
}

function compareChecksBySortType(
  checkA: Check,
  checkB: Check,
  sortType: CheckSort,
  reachabilityMap: Record<string, number>
) {
  if (sortType === CheckSort.AToZ) {
    return checkA.job.localeCompare(checkB.job);
  }

  if (sortType === CheckSort.ZToA) {
    return checkB.job.localeCompare(checkA.job);
  }

  if ([CheckSort.ReachabilityAsc, CheckSort.ReachabilityDesc].includes(sortType)) {
    const reachabilityA = reachabilityMap[getCheckCompositeKey(checkA.job, checkA.target)] ?? -1;
    const reachabilityB = reachabilityMap[getCheckCompositeKey(checkB.job, checkB.target)] ?? -1;

    if (sortType === CheckSort.ReachabilityAsc) {
      return reachabilityA - reachabilityB;
    }

    return reachabilityB - reachabilityA;
  }

  if (sortType === CheckSort.ExecutionsAsc) {
    const [sortA, sortB] = getNumberOfExecutions(checkA, checkB);
    return sortA - sortB;
  }

  if (sortType === CheckSort.ExecutionsDesc) {
    const [sortA, sortB] = getNumberOfExecutions(checkA, checkB);
    return sortB - sortA;
  }

  return 0;
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
