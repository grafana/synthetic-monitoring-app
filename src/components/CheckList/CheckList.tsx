// Libraries
import React, { useState, useContext, useEffect, useCallback } from 'react';

// Types
import {
  Check,
  Label,
  GrafanaInstances,
  FilteredCheck,
  CheckSort,
  CheckEnabledStatus,
  CheckListViewType,
  CheckType,
  FeatureName,
} from 'types';
import appEvents from 'grafana/app/core/app_events';
import {
  Button,
  Icon,
  Select,
  Input,
  Pagination,
  Checkbox,
  InlineSwitch,
  AsyncMultiSelect,
  ButtonCascader,
  useStyles2,
} from '@grafana/ui';
import {
  unEscapeStringFromRegex,
  escapeStringForRegex,
  GrafanaTheme2,
  AppEvents,
  SelectableValue,
  OrgRole,
} from '@grafana/data';
import { matchesAllFilters } from './checkFilters';
import {
  fetchProbeOptions,
  deleteSelectedChecks,
  deleteSingleCheck,
  getIconOverlayToggleFromLS,
  getViewTypeFromLS,
  enableSelectedChecks,
  disableSelectedChecks,
} from './actions';
import { hasRole } from 'utils';
import {
  CHECK_FILTER_OPTIONS,
  CHECK_LIST_SORT_OPTIONS,
  CHECK_LIST_STATUS_OPTIONS,
  CHECK_LIST_ICON_OVERLAY_LS_KEY,
  CHECKS_PER_PAGE_CARD,
  CHECKS_PER_PAGE_LIST,
} from '../constants';
import { CheckListItem } from '../CheckListItem';
import { css } from '@emotion/css';
import { LabelFilterInput } from '../LabelFilterInput';
import { SuccessRateContext, SuccessRateTypes } from 'contexts/SuccessRateContext';
import { ChecksVisualization } from '../ChecksVisualization';
import ThresholdGlobalSettings from '../Thresholds/ThresholdGlobalSettings';
import { BulkEditModal } from 'components/BulkEditModal';
import CheckFilterGroup from './CheckFilterGroup';
import EmptyCheckList from './EmptyCheckList';
import { PluginPage } from 'components/PluginPage';
import { config } from '@grafana/runtime';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { CheckListScene } from './CheckListScene';
import { CheckListViewSwitcher } from './CheckListViewSwitcher';
import { AddNewCheckButton } from './AddNewCheckButton';
import { ChecksContextProvider } from 'components/ChecksContextProvider';

const getStyles = (theme: GrafanaTheme2) => ({
  headerContainer: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: ${theme.spacing(2)};
  `,
  header: css`
    font-size: ${theme.typography.h4.fontSize};
    font-weight: ${theme.typography.fontWeightBold};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  subheader: css``,
  searchSortContainer: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${theme.spacing(1)};
  `,
  flexRow: css`
    display: flex;
    flex-direction: row;
  `,
  bulkActionContainer: css`
    padding: 0 0 ${theme.spacing(1)} ${theme.spacing(1)};
    display: flex;
    min-height: 48px;
    align-items: center;
  `,
  flexGrow: css`
    flex-grow: 1;
  `,
  buttonGroup: css`
    display: flex;
    align-items: center;
  `,
  checkboxContainer: css`
    margin-right: ${theme.spacing(2)};
  `,
  marginRightSmall: css`
    margin-right: ${theme.spacing(2)};
  `,
  vizContainer: css`
    width: 100%;
    display: flex;
    justify-content: center;
    height: calc(100% - 100px);
  `,
  verticalSpace: css`
    margin-top: 10px;
    margin-bottom: 10px;
    margin-right: ${theme.spacing(2)};
  `,
});

interface Props {
  instance: GrafanaInstances;
  checks: Check[];
  onCheckUpdate: (refetch?: boolean) => void;
}

export interface CheckFilters {
  [key: string]: any;
  search: string;
  labels: string[];
  type: CheckType | 'all';
  status: SelectableValue<CheckEnabledStatus>;
  probes: SelectableValue[] | [];
}

export const defaultFilters: CheckFilters = {
  search: '',
  labels: [],
  type: 'all',
  status: CHECK_LIST_STATUS_OPTIONS[0],
  probes: [],
};

export const CheckList = ({ instance, checks, onCheckUpdate }: Props) => {
  const [checkFilters, setCheckFilters] = useState<CheckFilters>(defaultFilters);
  const [filteredChecks, setFilteredChecks] = useState<FilteredCheck[] | []>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChecks, setSelectedChecks] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [viewType, setViewType] = useState(getViewTypeFromLS() ?? CheckListViewType.Card);
  const [sortType, setSortType] = useState<CheckSort>(CheckSort.AToZ);
  const [showVizIconOverlay, setShowVizIconOverlay] = useState(getIconOverlayToggleFromLS());
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [bulkEditAction, setBulkEditAction] = useState<'add' | 'remove' | null>(null);

  const styles = useStyles2(getStyles);
  const successRateContext = useContext(SuccessRateContext);
  const { isEnabled: scenesEnabled } = useFeatureFlag(FeatureName.Scenes);

  const sortChecks = useCallback(
    (checks: FilteredCheck[], sortType: CheckSort) => {
      switch (sortType) {
        case CheckSort.AToZ:
          return checks.sort((a, b) => a.job.localeCompare(b.job));
        case CheckSort.ZToA:
          return checks.sort((a, b) => b.job.localeCompare(a.job));
        case CheckSort.SuccessRate:
          return checks.sort((a, b) => {
            const checkA =
              successRateContext.values[SuccessRateTypes.Checks][a.id] ?? successRateContext.values.defaults;
            const checkB =
              successRateContext.values[SuccessRateTypes.Checks][b.id] ?? successRateContext.values.defaults;
            const sortA = checkA.noData ? 101 : checkA.reachabilityValue;
            const sortB = checkB.noData ? 101 : checkB.reachabilityValue;
            return sortA - sortB;
          });
      }
    },
    [successRateContext.values]
  );

  useEffect(() => {
    if (!scenesEnabled || viewType !== CheckListViewType.Viz) {
      const filtered = sortChecks(
        checks.filter((check) => matchesAllFilters(check, checkFilters)) as FilteredCheck[],
        sortType
      );
      setFilteredChecks(filtered);
    }
  }, [checkFilters, sortType, checks, sortChecks, viewType, scenesEnabled]);

  // This is so we aren't needlessly fetching data in the viz view, which doesn't use the successRateContext
  useEffect(() => {
    if (scenesEnabled && viewType === CheckListViewType.Viz) {
      successRateContext.pauseUpdates();
    } else {
      successRateContext.resumeUpdates();
    }
  }, [viewType, scenesEnabled, successRateContext]);

  const checksPerPage = viewType === CheckListViewType.Card ? CHECKS_PER_PAGE_CARD : CHECKS_PER_PAGE_LIST;
  const totalPages = Math.ceil(filteredChecks.length / checksPerPage);

  const handleResetFilters = () => {
    setCheckFilters(defaultFilters);
  };

  const handleLabelSelect = (label: Label) => {
    setCheckFilters((cf) => {
      return {
        ...cf,
        labels: [...cf.labels, `${label.name}: ${label.value}`],
      };
    });
    setCurrentPage(1);
  };

  const handleTypeSelect = (checkType: CheckType) => {
    setCheckFilters((cf) => {
      return { ...cf, type: checkType };
    });
    setCurrentPage(1);
  };

  const handleStatusSelect = (enabled: boolean) => {
    const status = enabled ? CheckEnabledStatus.Enabled : CheckEnabledStatus.Disabled;
    const option = CHECK_LIST_STATUS_OPTIONS.find(({ value }) => value === status);
    if (option) {
      setCheckFilters((cf) => {
        return {
          ...cf,
          status: option,
        };
      });
      setCurrentPage(1);
    }
  };

  const currentPageChecks = filteredChecks.slice((currentPage - 1) * checksPerPage, currentPage * checksPerPage);

  const toggleVisibleCheckSelection = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedChecks(new Set(currentPageChecks.map((check) => check.id)));
      return;
    }
    clearSelectedChecks();
  };

  const toggleAllCheckSelection = () => {
    setSelectedChecks(new Set(filteredChecks.map((check: FilteredCheck) => check.id)));
  };

  const clearSelectedChecks = () => {
    setSelectedChecks(new Set());
    setSelectAll(false);
  };

  const handleCheckSelect = (checkId: number) => {
    if (!selectedChecks.has(checkId)) {
      setSelectedChecks(new Set(selectedChecks.add(checkId)));
      return;
    }
    selectedChecks.delete(checkId);
    setSelectedChecks(new Set(selectedChecks));
    setSelectAll(false);
  };

  const getChecksFromSelected = () =>
    Array.from(selectedChecks)
      .map((checkId) => checks.find((check) => check.id && check.id === checkId))
      .filter(Boolean) as FilteredCheck[];

  const handleDisableSelectedChecks = async () => {
    setBulkActionInProgress(true);
    await disableSelectedChecks(instance, selectedChecks, getChecksFromSelected);
    clearSelectedChecks();
    setSelectAll(false);
    setBulkActionInProgress(false);
    onCheckUpdate(true);
  };

  const handleEnableSelectedChecks = async () => {
    setBulkActionInProgress(true);
    await enableSelectedChecks(instance, selectedChecks, getChecksFromSelected);
    clearSelectedChecks();
    setSelectAll(false);
    setBulkActionInProgress(false);
    onCheckUpdate(true);
  };

  const handleDeleteSingleCheck = async (check: Check) => {
    await deleteSingleCheck(instance, check, onCheckUpdate);
    onCheckUpdate(true);
  };

  const handleDeleteSelectedChecks = async () => {
    setBulkActionInProgress(true);
    await deleteSelectedChecks(instance, selectedChecks);
    clearSelectedChecks();
    setSelectAll(false);
    onCheckUpdate(true);
    setBulkActionInProgress(false);
  };

  const updateSortMethod = ({ value }: SelectableValue<CheckSort>) => {
    if (value !== undefined) {
      setSortType(value);
    }
  };

  if (!checks) {
    return null;
  }

  if (checks.length === 0) {
    return (
      <PluginPage pageNav={{ text: 'Checks', description: 'List of checks' }}>
        <EmptyCheckList />
      </PluginPage>
    );
  }

  const showHeaders = !scenesEnabled || viewType !== CheckListViewType.Viz;

  return (
    <PluginPage>
      {showHeaders && (
        <>
          <div className={styles.headerContainer}>
            <div>
              {!config.featureToggles.topnav && <h4 className={styles.header}>All checks</h4>}
              {!scenesEnabled ||
                (viewType !== CheckListViewType.Viz && (
                  <div className={styles.subheader}>
                    Currently showing {currentPageChecks.length} of {checks.length} total checks
                  </div>
                ))}
            </div>
            <div className={styles.flexRow}>
              <Input
                className={styles.marginRightSmall}
                autoFocus
                aria-label="Search checks"
                prefix={<Icon name="search" />}
                width={40}
                data-testid="check-search-input"
                type="text"
                value={checkFilters.search ? unEscapeStringFromRegex(checkFilters.search) : ''}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setCheckFilters((cf) => {
                    return {
                      ...cf,
                      search: escapeStringForRegex(value),
                    };
                  });
                }}
                placeholder="Search by job name, endpoint, or label"
              />
              <CheckFilterGroup onReset={handleResetFilters} filters={checkFilters}>
                <div className={styles.flexRow}>
                  <Select
                    prefix="Status"
                    aria-label="Filter by status"
                    data-testid="check-status-filter"
                    options={CHECK_LIST_STATUS_OPTIONS}
                    width={20}
                    className={styles.verticalSpace}
                    onChange={(option) => {
                      setCurrentPage(1);
                      setCheckFilters((cf) => {
                        return {
                          ...cf,
                          status: option,
                        };
                      });
                    }}
                    value={checkFilters.status}
                  />
                  <Select
                    aria-label="Filter by type"
                    prefix="Types"
                    data-testid="check-type-filter"
                    options={CHECK_FILTER_OPTIONS}
                    className={styles.verticalSpace}
                    width={20}
                    onChange={(selected: SelectableValue) => {
                      setCurrentPage(1);
                      setCheckFilters((cf) => {
                        return {
                          ...cf,
                          type: selected?.value ?? checkFilters.type,
                        };
                      });
                    }}
                    value={checkFilters.type}
                  />
                </div>
                <LabelFilterInput
                  checks={checks}
                  onChange={(labels) => {
                    setCurrentPage(1);
                    setCheckFilters((cf) => {
                      return {
                        ...cf,
                        labels,
                      };
                    });
                  }}
                  labelFilters={checkFilters.labels}
                  className={styles.verticalSpace}
                />
                <AsyncMultiSelect
                  aria-label="Filter by probe"
                  data-testid="probe-filter"
                  prefix="Probes"
                  onChange={(v) => {
                    setCurrentPage(1);
                    setCheckFilters((cf) => {
                      return {
                        ...cf,
                        probes: v,
                      };
                    });
                  }}
                  defaultOptions
                  loadOptions={() => fetchProbeOptions(instance)}
                  value={checkFilters.probes}
                  placeholder="All probes"
                  allowCustomValue={false}
                  isSearchable={true}
                  isClearable={true}
                  closeMenuOnSelect={false}
                  className={styles.verticalSpace}
                />
              </CheckFilterGroup>
              {hasRole(OrgRole.Editor) && (
                <>
                  <Button
                    variant="secondary"
                    fill="outline"
                    onClick={() => setShowThresholdModal((v) => !v)}
                    className={styles.marginRightSmall}
                  >
                    Set Thresholds
                  </Button>
                  <AddNewCheckButton />
                </>
              )}
            </div>
          </div>
          <div className={styles.searchSortContainer}>
            <div className={styles.flexRow}></div>
          </div>
          <div className={styles.bulkActionContainer}>
            <div className={styles.checkboxContainer}>
              <Checkbox
                onChange={toggleVisibleCheckSelection}
                value={selectAll}
                aria-label="Select all"
                data-testid="selectAll"
              />
            </div>
            {selectedChecks.size > 0 ? (
              <>
                <span className={styles.marginRightSmall}>{selectedChecks.size} checks are selected.</span>
                <div className={styles.buttonGroup}>
                  {selectedChecks.size < filteredChecks.length && (
                    <Button
                      type="button"
                      fill="text"
                      size="sm"
                      className={styles.marginRightSmall}
                      onClick={toggleAllCheckSelection}
                      disabled={!hasRole(OrgRole.Editor)}
                    >
                      Select all {filteredChecks.length} checks
                    </Button>
                  )}
                  {selectedChecks.size > 1 && (
                    <ButtonCascader
                      options={[
                        {
                          label: 'Add probes',
                          value: 'add',
                        },
                        {
                          label: 'Remove probes',
                          value: 'remove',
                        },
                      ]}
                      className={styles.marginRightSmall}
                      disabled={!hasRole(OrgRole.Editor) || bulkActionInProgress}
                      onChange={(value) => setBulkEditAction(value[0] as any)}
                    >
                      Bulk Edit Probes
                    </ButtonCascader>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    fill="text"
                    onClick={handleEnableSelectedChecks}
                    className={styles.marginRightSmall}
                    disabled={!hasRole(OrgRole.Editor) || bulkActionInProgress}
                  >
                    Enable
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fill="text"
                    onClick={handleDisableSelectedChecks}
                    className={styles.marginRightSmall}
                    disabled={!hasRole(OrgRole.Editor) || bulkActionInProgress}
                  >
                    Disable
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    fill="text"
                    className={styles.marginRightSmall}
                    onClick={handleDeleteSelectedChecks}
                    disabled={!hasRole(OrgRole.Editor) || bulkActionInProgress}
                  >
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <CheckListViewSwitcher setViewType={setViewType} setCurrentPage={setCurrentPage} viewType={viewType} />
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
            <div className={styles.flexGrow} />
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
              onChange={updateSortMethod}
            />
          </div>
        </>
      )}
      {viewType === CheckListViewType.Viz ? (
        <ChecksContextProvider>
          <div className={styles.vizContainer}>
            {scenesEnabled ? (
              <CheckListScene setViewType={setViewType} setCurrentPage={setCurrentPage} />
            ) : (
              <ChecksVisualization checks={filteredChecks} showIcons={showVizIconOverlay} />
            )}
          </div>
        </ChecksContextProvider>
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
                  selected={selectedChecks.has(check.id)}
                  viewType={viewType}
                  onDeleteCheck={() => handleDeleteSingleCheck(check)}
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
      <ThresholdGlobalSettings
        onDismiss={() => setShowThresholdModal(false)}
        isOpen={showThresholdModal}
        onSuccess={() => appEvents.emit(AppEvents.alertSuccess, ['Thresholds updated'])}
        onError={() =>
          appEvents.emit(AppEvents.alertError, [`Error updating thresholds. make sure your values don't overlap`])
        }
      />
      <BulkEditModal
        instance={instance}
        selectedChecks={getChecksFromSelected}
        onDismiss={() => setBulkEditAction(null)}
        action={bulkEditAction}
        isOpen={bulkEditAction !== null}
        onSuccess={() => {
          onCheckUpdate(true);
          appEvents.emit(AppEvents.alertSuccess, ['All selected checks successfully updated']);
        }}
        onError={(err) => {
          appEvents.emit(AppEvents.alertError, [`There was an error updating checks: ${err}`]);
        }}
      />
    </PluginPage>
  );
};
