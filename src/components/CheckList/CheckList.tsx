// Libraries
import React, { useState, useContext, useEffect, useCallback } from 'react';

// Types
import {
  OrgRole,
  Check,
  Label,
  GrafanaInstances,
  FilteredCheck,
  CheckSort,
  CheckEnabledStatus,
  CheckListViewType,
  CheckType,
  ROUTES,
} from 'types';
import appEvents from 'grafana/app/core/app_events';
import {
  Button,
  Icon,
  Select,
  Input,
  Pagination,
  InfoBox,
  Checkbox,
  useStyles,
  RadioButtonGroup,
  InlineSwitch,
  AsyncMultiSelect,
  ButtonCascader,
} from '@grafana/ui';
import { unEscapeStringFromRegex, escapeStringForRegex, GrafanaTheme, AppEvents, SelectableValue } from '@grafana/data';
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
  CHECK_LIST_VIEW_TYPE_OPTIONS,
  CHECK_LIST_VIEW_TYPE_LS_KEY,
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
import { useNavigation } from 'hooks/useNavigation';
import { BulkEditModal } from 'components/BulkEditModal';

const getStyles = (theme: GrafanaTheme) => ({
  headerContainer: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: ${theme.spacing.md};
  `,
  header: css`
    font-size: ${theme.typography.heading.h4};
    font-weight: ${theme.typography.weight.bold};
    margin-bottom: ${theme.spacing.xs};
  `,
  subheader: css``,
  searchSortContainer: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${theme.spacing.sm};
  `,
  flexRow: css`
    display: flex;
    flex-direction: row;
  `,
  bulkActionContainer: css`
    padding: 0 0 ${theme.spacing.sm} ${theme.spacing.sm};
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
    margin-right: ${theme.spacing.md};
  `,
  marginRightSmall: css`
    margin-right: ${theme.spacing.sm};
  `,
  vizContainer: css`
    width: 100%;
    display: flex;
    justify-content: center;
  `,
});

interface Props {
  instance: GrafanaInstances;
  checks: Check[];
  onCheckUpdate: () => void;
}

export interface CheckFilters {
  search: string;
  labels: string[];
  type: CheckType | 'all';
  status: SelectableValue<CheckEnabledStatus>;
  probes: SelectableValue[] | [];
}

const defaultFilters: CheckFilters = {
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
  const navigate = useNavigation();

  const styles = useStyles(getStyles);
  const successRateContext = useContext(SuccessRateContext);

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
    const filtered = sortChecks(
      checks.filter((check) => matchesAllFilters(check, checkFilters)) as FilteredCheck[],
      sortType
    );
    setFilteredChecks(filtered);
  }, [checkFilters, sortType, checks, sortChecks]);

  const checksPerPage = viewType === CheckListViewType.Card ? CHECKS_PER_PAGE_CARD : CHECKS_PER_PAGE_LIST;
  const totalPages = Math.ceil(filteredChecks.length / checksPerPage);

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
    onCheckUpdate();
  };

  const handleEnableSelectedChecks = async () => {
    setBulkActionInProgress(true);
    await enableSelectedChecks(instance, selectedChecks, getChecksFromSelected);
    clearSelectedChecks();
    setSelectAll(false);
    setBulkActionInProgress(false);
    onCheckUpdate();
  };

  const handleDeleteSingleCheck = async (check: Check) => {
    await deleteSingleCheck(instance, check, onCheckUpdate);
  };

  const handleDeleteSelectedChecks = async () => {
    setBulkActionInProgress(true);
    await deleteSelectedChecks(instance, selectedChecks);
    clearSelectedChecks();
    setSelectAll(false);
    onCheckUpdate();
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
      <InfoBox
        title="Grafana Cloud Synthetic Monitoring"
        url={'https://grafana.com/docs/grafana-cloud/synthetic-monitoring/'}
      >
        <p>
          This account does not currently have any checks configured. Click the button below to start monitoring your
          services with Grafana Cloud.
        </p>
        {hasRole(OrgRole.EDITOR) && (
          <Button variant="primary" onClick={() => navigate(ROUTES.NewCheck)} type="button">
            New Check
          </Button>
        )}
      </InfoBox>
    );
  }

  return (
    <div>
      <div className={styles.headerContainer}>
        <div>
          <h4 className={styles.header}>All checks</h4>
          <div className={styles.subheader}>
            Currently showing {currentPageChecks.length} of {checks.length} total checks
          </div>
        </div>
        <div>
          {hasRole(OrgRole.EDITOR) && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowThresholdModal((v) => !v)}
                className={styles.marginRightSmall}
              >
                Set Thresholds
              </Button>
              <Button variant="primary" onClick={() => navigate(ROUTES.NewCheck)} type="button">
                Add new check
              </Button>
            </>
          )}
        </div>
      </div>
      <div className={styles.searchSortContainer}>
        <Input
          autoFocus
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
        <div className={styles.flexRow}>
          <Select
            prefix="Status"
            data-testid="check-status-filter"
            className={styles.marginRightSmall}
            options={CHECK_LIST_STATUS_OPTIONS}
            width={20}
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
            aria-label="Types"
            prefix="Types"
            data-testid="check-type-filter"
            options={CHECK_FILTER_OPTIONS}
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
      </div>
      <div className={styles.searchSortContainer}>
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
          className={styles.marginRightSmall}
        />
        <AsyncMultiSelect
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
        />
      </div>
      <div className={styles.bulkActionContainer}>
        <div className={styles.checkboxContainer}>
          <Checkbox onChange={toggleVisibleCheckSelection} value={selectAll} data-testid="selectAll" />
        </div>
        {selectedChecks.size > 0 ? (
          <>
            <span className={styles.marginRightSmall}>{selectedChecks.size} checks are selected.</span>
            <div className={styles.buttonGroup}>
              {selectedChecks.size < filteredChecks.length && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className={styles.marginRightSmall}
                  onClick={toggleAllCheckSelection}
                  disabled={!hasRole(OrgRole.EDITOR)}
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
                  disabled={!hasRole(OrgRole.EDITOR) || bulkActionInProgress}
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
                disabled={!hasRole(OrgRole.EDITOR) || bulkActionInProgress}
              >
                Enable
              </Button>
              <Button
                type="button"
                variant="secondary"
                fill="text"
                onClick={handleDisableSelectedChecks}
                className={styles.marginRightSmall}
                disabled={!hasRole(OrgRole.EDITOR) || bulkActionInProgress}
              >
                Disable
              </Button>

              <Button
                type="button"
                variant="destructive"
                fill="text"
                className={styles.marginRightSmall}
                onClick={handleDeleteSelectedChecks}
                disabled={!hasRole(OrgRole.EDITOR) || bulkActionInProgress}
              >
                Delete
              </Button>
            </div>
          </>
        ) : (
          <RadioButtonGroup
            value={viewType}
            onChange={(value) => {
              if (value !== undefined) {
                setViewType(value);
                window.localStorage.setItem(CHECK_LIST_VIEW_TYPE_LS_KEY, String(value));
                setCurrentPage(1);
              }
            }}
            options={CHECK_LIST_VIEW_TYPE_OPTIONS}
          />
        )}
        {viewType === CheckListViewType.Viz && (
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
      {viewType === CheckListViewType.Viz ? (
        <div className={styles.vizContainer}>
          <ChecksVisualization checks={filteredChecks} showIcons={showVizIconOverlay} />
        </div>
      ) : (
        <div>
          <section className="card-section card-list-layout-list">
            <ol className="card-list">
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
            </ol>
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
          onCheckUpdate();
          appEvents.emit(AppEvents.alertSuccess, ['All selected checks successfully updated']);
        }}
        onError={(err) => {
          appEvents.emit(AppEvents.alertError, [`There was an error updating checks: ${err}`]);
        }}
      />
    </div>
  );
};
