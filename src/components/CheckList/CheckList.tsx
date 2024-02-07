import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AppEvents, GrafanaTheme2, OrgRole, SelectableValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Button, ButtonCascader, Checkbox, Icon, InlineSwitch, Pagination, Select, useStyles2 } from '@grafana/ui';
import appEvents from 'grafana/app/core/app_events';
import { css } from '@emotion/css';

import {
  Check,
  CheckEnabledStatus,
  CheckFiltersType,
  CheckListViewType,
  CheckSort,
  CheckType,
  FeatureName,
  FilteredCheck,
  Label,
} from 'types';
import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useChecks } from 'data/useChecks';
import { useThresholds } from 'data/useThresholds';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { BulkEditModal } from 'components/BulkEditModal';
import { CheckFilters, defaultFilters, getDefaultFilters } from 'components/CheckFilters';
import { PluginPage } from 'components/PluginPage';

import { CheckListItem } from '../CheckListItem';
import {
  CHECK_LIST_ICON_OVERLAY_LS_KEY,
  CHECK_LIST_SORT_OPTIONS,
  CHECK_LIST_STATUS_OPTIONS,
  CHECKS_PER_PAGE_CARD,
  CHECKS_PER_PAGE_LIST,
} from '../constants';
import ThresholdGlobalSettings from '../Thresholds/ThresholdGlobalSettings';
import {
  deleteSelectedChecks,
  deleteSingleCheck,
  disableSelectedChecks,
  enableSelectedChecks,
  getIconOverlayToggleFromLS,
  getViewTypeFromLS,
} from './actions';
import { AddNewCheckButton } from './AddNewCheckButton';
import { matchesAllFilters } from './checkFilters';
import { CheckListScene } from './CheckListScene';
import { CheckListViewSwitcher } from './CheckListViewSwitcher';
import EmptyCheckList from './EmptyCheckList';

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

const checks: Check[] = [
  {
    id: 1840,
    tenantId: 76,
    frequency: 60000,
    offset: 0,
    timeout: 3000,
    enabled: true,
    labels: [],
    settings: {
      dns: {
        ipVersion: 'V4',
        server: 'dns.google',
        port: 53,
        recordType: 'A',
        protocol: 'UDP',
        validRCodes: ['NOERROR'],
        validateAnswerRRS: {},
        validateAuthorityRRS: {},
      },
    },
    probes: [57, 161],
    target: 'grafana.com',
    job: 'DNS check',
    basicMetricsOnly: true,
    alertSensitivity: 'low',
    created: 1697037816.2432737,
    modified: 1704195088.1403291,
  },
  {
    id: 1841,
    tenantId: 76,
    frequency: 120000,
    offset: 0,
    timeout: 3000,
    enabled: true,
    labels: [],
    settings: {
      multihttp: {
        entries: [
          {
            request: {
              method: 'GET',
              url: 'https://grafana.com',
            },
          },
          {
            request: {
              method: 'GET',
              url: 'https://test.k6.io/',
            },
          },
        ],
      },
    },
    probes: [57, 65, 161],
    target: 'https://grafana.com',
    job: 'Multihttp',
    basicMetricsOnly: true,
    alertSensitivity: 'none',
    created: 1697038562.4949615,
    modified: 1707307943.047411,
  },
  {
    id: 1862,
    tenantId: 76,
    frequency: 120000,
    offset: 0,
    timeout: 4000,
    enabled: true,
    labels: [],
    settings: {
      multihttp: {
        entries: [
          {
            request: {
              method: 'GET',
              url: 'https://swapi.dev/api/people/1',
            },
            variables: [
              {
                type: 0,
                name: 'film0',
                expression: 'films.0',
              },
            ],
          },
          {
            request: {
              method: 'GET',
              url: '${film0}',
            },
            checks: [
              {
                type: 1,
                condition: 2,
                expression: 'title',
                value: 'A New Hope',
              },
            ],
          },
        ],
      },
    },
    probes: [57, 65, 161],
    target: 'https://swapi.dev/api/people/1',
    job: 'Swapi',
    basicMetricsOnly: true,
    alertSensitivity: 'none',
    created: 1698769847.639588,
    modified: 1707304344.9085186,
  },
  {
    id: 1898,
    tenantId: 76,
    frequency: 60000,
    offset: 0,
    timeout: 3000,
    enabled: true,
    labels: [],
    settings: {
      ping: {
        ipVersion: 'V4',
        dontFragment: false,
        packetCount: 0,
      },
    },
    probes: [57, 65, 70, 161],
    target: 'grafana.com',
    job: 'Ping job name',
    basicMetricsOnly: true,
    alertSensitivity: 'none',
    created: 1700759206.9702597,
    modified: 1707308067.0322437,
  },
  {
    id: 1907,
    tenantId: 76,
    frequency: 10000,
    offset: 0,
    timeout: 1000,
    enabled: true,
    labels: [],
    settings: {
      http: {
        ipVersion: 'V4',
        method: 'GET',
        noFollowRedirects: false,
        tlsConfig: {},
        failIfSSL: false,
        failIfNotSSL: false,
      },
    },
    probes: [65],
    target: 'https://www.githubstatus.com/',
    job: 'gitubStatus',
    basicMetricsOnly: true,
    alertSensitivity: 'low',
    created: 1704808484.2077816,
    modified: 1704808484.2077816,
  },
  {
    id: 1915,
    tenantId: 76,
    frequency: 60000,
    offset: 0,
    timeout: 10000,
    enabled: true,
    labels: [
      {
        name: 'labelname',
        value: 'labelvalue',
      },
      {
        name: 'grafana',
        value: 'website',
      },
    ],
    settings: {
      k6: {
        script:
          'aW1wb3J0IHsgc2xlZXAgfSBmcm9tICdrNicKaW1wb3J0IGh0dHAgZnJvbSAnazYvaHR0cCcKCmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1haW4oKSB7CiAgbGV0IHJlc3BvbnNlID0gaHR0cC5nZXQoJ2h0dHBzOi8vd3d3LmdyYWZhbmEuY29tJykKICBzbGVlcCgxKQp9',
      },
    },
    probes: [57, 65, 70, 161],
    target: 'https://www.grafana.com',
    job: 'A lovely scripted check',
    basicMetricsOnly: true,
    alertSensitivity: 'medium',
    created: 1706025187.2305074,
    modified: 1707307922.51613,
  },
  {
    id: 1916,
    tenantId: 76,
    frequency: 60000,
    offset: 0,
    timeout: 10000,
    enabled: true,
    labels: [],
    settings: {
      k6: {
        script:
          'aW1wb3J0IHsgc2xlZXAgfSBmcm9tICdrNicKaW1wb3J0IGh0dHAgZnJvbSAnazYvaHR0cCcKCmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1haW4oKSB7CiAgbGV0IHJlc3BvbnNlID0gaHR0cC5nZXQoJ2h0dHBzOi8vd3d3LmdyYWZhbmEuY29tJykKICBzbGVlcCgxKQp9',
      },
    },
    probes: [57, 65, 70, 161],
    target: 'http://grafana.com',
    job: 'A lovely scripted check 2',
    basicMetricsOnly: true,
    alertSensitivity: 'none',
    created: 1706026602.2593782,
    modified: 1707310921.9938803,
  },
  {
    id: 1934,
    tenantId: 76,
    frequency: 100000,
    offset: 0,
    timeout: 1000,
    enabled: true,
    labels: [],
    settings: {
      http: {
        ipVersion: 'V4',
        method: 'GET',
        noFollowRedirects: false,
        tlsConfig: {},
        failIfSSL: false,
        failIfNotSSL: false,
      },
    },
    probes: [57, 65, 70, 161],
    target: 'https://grafana.com',
    job: 'A new check',
    basicMetricsOnly: true,
    alertSensitivity: 'medium',
    created: 1707233843.011894,
    modified: 1707302040.4978206,
  },
  {
    id: 1935,
    tenantId: 76,
    frequency: 60000,
    offset: 0,
    timeout: 3000,
    enabled: true,
    labels: [],
    settings: {
      http: {
        ipVersion: 'V4',
        method: 'GET',
        noFollowRedirects: false,
        tlsConfig: {},
        failIfSSL: false,
        failIfNotSSL: false,
      },
    },
    probes: [57],
    target: 'https://grafana.com',
    job: 'c',
    basicMetricsOnly: true,
    alertSensitivity: 'none',
    created: 1707307541.5671232,
    modified: 1707307541.5671232,
  },
];
const isLoading = false;

export const CheckList = () => {
  const { instance } = useContext(InstanceContext);
  const { data: thresholds } = useThresholds();
  // const { data: checks = [], isLoading } = useChecks();

  const [checkFilters, setCheckFilters] = useState<CheckFiltersType>(getDefaultFilters());
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
            console.log(thresholds);
            const checkA = 1;
            const checkB = 2;
            // const sortA = checkA.noData ? 101 : checkA.reachabilityValue;
            // const sortB = checkB.noData ? 101 : checkB.reachabilityValue;
            return checkA - checkB;
          });
      }
    },
    [thresholds]
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

  const checksPerPage = viewType === CheckListViewType.Card ? CHECKS_PER_PAGE_CARD : CHECKS_PER_PAGE_LIST;
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
  };

  const handleEnableSelectedChecks = async () => {
    setBulkActionInProgress(true);
    await enableSelectedChecks(instance, selectedChecks, getChecksFromSelected);
    clearSelectedChecks();
    setSelectAll(false);
    setBulkActionInProgress(false);
  };

  const handleDeleteSingleCheck = async (check: Check) => {
    await deleteSingleCheck(instance, check);
  };

  const handleDeleteSelectedChecks = async () => {
    setBulkActionInProgress(true);
    await deleteSelectedChecks(instance, selectedChecks);
    clearSelectedChecks();
    setSelectAll(false);
    setBulkActionInProgress(false);
  };

  const updateSortMethod = ({ value }: SelectableValue<CheckSort>) => {
    if (value !== undefined) {
      setSortType(value);
    }
  };

  // if (isLoading) {
  //   return null;
  // }

  // if (checks.length === 0) {
  //   console.log({ isLoading });
  //   return (
  //     <PluginPage pageNav={{ text: 'Checks' }}>
  //       <EmptyCheckList />
  //     </PluginPage>
  //   );
  // }

  const showHeaders = !scenesEnabled || viewType !== CheckListViewType.Viz;

  return (
    <PluginPage pageNav={{ text: 'Checks' }}>
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
              <CheckFilters
                handleResetFilters={handleResetFilters}
                checks={checks}
                checkFilters={checkFilters}
                onChange={(filters: CheckFiltersType) => {
                  setCheckFilters(filters);
                  localStorage.setItem('checkFilters', JSON.stringify(filters));
                }}
              />
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
        <div className={styles.vizContainer}>
          <CheckListScene
            setViewType={setViewType}
            setCurrentPage={setCurrentPage}
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
      <ThresholdGlobalSettings onDismiss={() => setShowThresholdModal(false)} isOpen={showThresholdModal} />
      <BulkEditModal
        instance={instance}
        selectedChecks={getChecksFromSelected}
        onDismiss={() => setBulkEditAction(null)}
        action={bulkEditAction}
        isOpen={bulkEditAction !== null}
        onSuccess={() => {
          appEvents.emit(AppEvents.alertSuccess, ['All selected checks successfully updated']);
        }}
        onError={(err) => {
          appEvents.emit(AppEvents.alertError, [`There was an error updating checks: ${err}`]);
        }}
      />
    </PluginPage>
  );
};
