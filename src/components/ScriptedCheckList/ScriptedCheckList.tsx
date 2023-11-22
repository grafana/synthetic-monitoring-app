import React, { useContext, useEffect, useState } from 'react';
import { Table } from '@grafana/cloud-features';
import { AppEvents, GrafanaTheme2, OrgRole } from '@grafana/data';
import { config, getAppEvents, PluginPage } from '@grafana/runtime';
import { SceneComponentProps, sceneGraph, SceneObjectBase } from '@grafana/scenes';
import { LoadingState } from '@grafana/schema';
import { Alert, Button, ButtonCascader, Icon, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFiltersType, FilteredCheck, GrafanaInstances, ROUTES } from 'types';
import { hasRole } from 'utils';
import { ChecksContext } from 'contexts/ChecksContext';
import { InstanceContext } from 'contexts/InstanceContext';
import { ThresholdSettings, ThresholdValues } from 'contexts/SuccessRateContext';
import { useNavigation } from 'hooks/useNavigation';
import { BulkEditModal } from 'components/BulkEditModal';
import { CheckFilters, defaultFilters, getDefaultFilters } from 'components/CheckFilters';
import { AddNewCheckButton } from 'components/CheckList/AddNewCheckButton';
import { matchesAllFilters } from 'components/CheckList/checkFilters';
import ThresholdGlobalSettings from 'components/Thresholds/ThresholdGlobalSettings';

import { deleteSelectedChecks, disableSelectedChecks, enableSelectedChecks } from './actions';

function getStyles(theme: GrafanaTheme2) {
  return {
    error: css({
      color: theme.colors.error.text,
      textAlign: 'center',
    }),
    warning: css({
      color: theme.colors.warning.text,
      textAlign: 'center',
    }),
    green: css({
      color: theme.colors.success.text,
      textAlign: 'center',
    }),
    grey: css({
      color: theme.colors.info.text,
      textAlign: 'center',
    }),
    flex: css({
      display: 'flex',
    }),
    spaceBetween: css({
      display: 'flex',
      justifyContent: 'space-between',
    }),
    marginRightSmall: css({
      marginRight: theme.spacing(1),
    }),
    buttonGroup: css({
      display: 'flex',
      gap: theme.spacing(1),
    }),
    bulkActionContainer: css({
      padding: theme.spacing(1),
      height: '40px',
    }),
  };
}

enum ListUnit {
  Percent = '%',
  Milliseconds = 'ms',
}

function SuccessStateValue({
  value,
  thresholds,
  unit,
}: {
  value?: number;
  thresholds?: ThresholdValues;
  unit: ListUnit;
}) {
  const styles = useStyles2(getStyles);
  if (value === undefined) {
    return <div> - </div>;
  }
  const normalized = unit === ListUnit.Percent ? value * 100 : value * 1000;
  let style;
  const upperLimit = thresholds?.upperLimit ?? 0;
  const lowerLimit = thresholds?.lowerLimit ?? 0;
  switch (true) {
    case thresholds === undefined:
      style = styles.grey;
      break;
    case normalized > upperLimit:
      style = styles.green;
      break;
    case normalized < upperLimit && normalized > lowerLimit:
      style = styles.warning;
      break;
    case normalized < lowerLimit:
    default:
      style = styles.error;
      break;
  }
  const formatted = unit === ListUnit.Percent ? normalized.toFixed(2) : normalized.toFixed(0);
  return (
    <div className={style}>
      {formatted}
      {unit}
    </div>
  );
}

interface DataTableScriptedCheck extends Check {
  up?: number;
  uptime?: number;
  reachability?: number;
  latency?: number;
  notFound?: boolean;
}

export class ScriptedChecksListSceneObject extends SceneObjectBase {
  static Component = ScriptedCheckList;
}

const appEvents = getAppEvents();

export function ScriptedCheckList({ model }: SceneComponentProps<any>) {
  const navigate = useNavigation();
  const styles = useStyles2(getStyles);
  const { instance } = useContext(InstanceContext);
  const { checks } = useContext(ChecksContext);
  const [filteredChecks, setFilteredChecks] = useState<FilteredCheck[] | []>([]);
  const [checkFilters, setCheckFilters] = useState<CheckFiltersType>(getDefaultFilters());
  const [thresholds, setThresholds] = useState<ThresholdSettings>();
  const [selectedChecks, setSelectedChecks] = useState<{
    allSelected: false;
    selectedCount: number;
    selectedRows: Check[];
  }>({ allSelected: false, selectedCount: 0, selectedRows: [] });
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const [bulkEditAction, setBulkEditAction] = useState<'add' | 'remove' | null>(null);
  const [toggledClearRows, setToggleClearRows] = React.useState(false);
  const data = sceneGraph.getData(model).useState();

  useEffect(() => {
    instance.api?.getTenantSettings().then(({ thresholds }) => {
      setThresholds(thresholds);
    });
  }, [instance]);

  useEffect(() => {
    const filtered = checks.filter((check) => matchesAllFilters(check, checkFilters)) as FilteredCheck[];
    setFilteredChecks(filtered);
  }, [checkFilters, checks, data]);

  const fields = data.data?.series?.[0]?.fields;
  const tableData = filteredChecks.map((check) => {
    const dataIndex = data.data?.series?.[0]?.fields?.[0]?.values.findIndex((v) => v === check.job);
    if (dataIndex === undefined || dataIndex < 0) {
      return {
        ...check,
        notFound: true,
      };
    }
    return {
      ...check,
      up: fields?.[3]?.values?.[dataIndex],
      uptime: fields?.[4]?.values?.[dataIndex],
      reachability: fields?.[5]?.values?.[dataIndex],
      latency: fields?.[6]?.values?.[dataIndex],
      notFound: false,
    };
  });

  const columns = [
    {
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.up,
      width: '95px',
      cell: (row: DataTableScriptedCheck) => {
        if (row.up === undefined) {
          return <div></div>;
        }
        if (row.up === 1) {
          return (
            <div className={styles.green}>
              Up &nbsp;
              <Icon name="arrow-up" />
            </div>
          );
        }
        return (
          <div className={styles.error}>
            Down &nbsp;
            <Icon name="arrow-down" />
          </div>
        );
      },
    },
    {
      name: 'job',
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.job,
    },
    {
      name: 'instance',
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.target,
    },
    {
      name: 'uptime',
      sortable: true,
      sortFunction: (a: DataTableScriptedCheck, b: DataTableScriptedCheck) => {
        return (b?.uptime ?? -1) - (a?.uptime ?? -1);
      },
      selector: (row: DataTableScriptedCheck) => row.uptime,
      cell: (row: DataTableScriptedCheck) => {
        return <SuccessStateValue value={row.uptime} thresholds={thresholds?.uptime} unit={ListUnit.Percent} />;
      },
    },
    {
      name: 'reachability',
      sortable: true,

      sortFunction: (a: DataTableScriptedCheck, b: DataTableScriptedCheck) => {
        return (b?.reachability ?? -1) - (a?.reachability ?? -1);
      },
      selector: (row: DataTableScriptedCheck) => row.reachability,
      cell: (row: DataTableScriptedCheck) => {
        return (
          <SuccessStateValue value={row.reachability} thresholds={thresholds?.reachability} unit={ListUnit.Percent} />
        );
      },
    },
    {
      name: 'latency',
      sortable: true,

      sortFunction: (a: DataTableScriptedCheck, b: DataTableScriptedCheck) => {
        return (b?.latency ?? -1) - (a?.latency ?? -1);
      },
      selector: (row: DataTableScriptedCheck) => row.latency,
      cell: (row: DataTableScriptedCheck) => {
        return <SuccessStateValue value={row.latency} thresholds={thresholds?.latency} unit={ListUnit.Milliseconds} />;
      },
    },
    {
      name: 'probes',
      sortable: true,
      selector: (row: DataTableScriptedCheck) => row.probes,
    },
  ];

  if (checks.length === 0) {
    return (
      <PluginPage pageNav={{ text: 'Scripted checks' }}>
        <Alert
          severity="info"
          title="Grafana Cloud Synthetic Monitoring"
          buttonContent={<span>New Check</span>}
          onRemove={() => navigate(`${ROUTES.Checks}/new`)}
        >
          This account does not currently have any scripted checks configured. Click the New Check button to start
          monitoring your services with Grafana Cloud, or{' '}
          <a href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/">
            check out the Synthetic Monitoring docs.
          </a>
        </Alert>
      </PluginPage>
    );
  }

  if (data.data?.state === LoadingState.Loading) {
    return <LoadingPlaceholder text={undefined} />;
  }

  const handleResetFilters = () => {
    setCheckFilters(defaultFilters);
    localStorage.removeItem('checkFilters');
  };

  const clearSelectedChecks = () => {
    setToggleClearRows(!toggledClearRows);
  };

  const handleBulkAction = async (action: (instance: GrafanaInstances, selectedChecks: Check[]) => Promise<void>) => {
    setBulkActionInProgress(true);
    await action(instance, selectedChecks.selectedRows);
    clearSelectedChecks();
    setBulkActionInProgress(false);
  };

  return (
    <div>
      <div className={styles.spaceBetween}>
        <div className={styles.flex}>
          <CheckFilters
            handleResetFilters={handleResetFilters}
            checks={checks}
            checkFilters={checkFilters}
            onChange={(filters: CheckFiltersType) => {
              setCheckFilters(filters);
              localStorage.setItem('checkFilters', JSON.stringify(filters));
            }}
          />
          <ThresholdGlobalSettings />
        </div>
        <AddNewCheckButton />
      </div>

      <div className={styles.bulkActionContainer}>
        {selectedChecks.selectedCount > 0 && (
          <>
            <div className={styles.buttonGroup}>
              {!selectedChecks.allSelected && (
                <Button
                  type="button"
                  fill="text"
                  size="sm"
                  className={styles.marginRightSmall}
                  onClick={() => {}}
                  disabled={!hasRole(OrgRole.Editor)}
                >
                  Select all {filteredChecks.length} checks
                </Button>
              )}
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
              <Button
                type="button"
                variant="primary"
                fill="text"
                onClick={() => handleBulkAction(enableSelectedChecks)}
                className={styles.marginRightSmall}
                disabled={!hasRole(OrgRole.Editor) || bulkActionInProgress}
              >
                Enable
              </Button>
              <Button
                type="button"
                variant="secondary"
                fill="text"
                onClick={() => handleBulkAction(disableSelectedChecks)}
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
                onClick={() => handleBulkAction(deleteSelectedChecks)}
                disabled={!hasRole(OrgRole.Editor) || bulkActionInProgress}
              >
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
      <Table<DataTableScriptedCheck>
        id="scripted-checks-table"
        name="scripted-checks-table"
        noDataText="No scripted checks found"
        dataTableProps={{
          selectableRows: true,
          onSelectedRowsChange: (state: any) => {
            console.log(state);
            setSelectedChecks(state);
          },
          clearSelectedRows: toggledClearRows,
        }}
        columns={columns}
        onRowClicked={(row) => {
          if (row.id) {
            navigate(`${ROUTES.Checks}/${row.id}`);
          }
        }}
        config={config}
        data={tableData}
        pagination
      />
      <BulkEditModal
        instance={instance}
        selectedChecks={() => selectedChecks.selectedRows as FilteredCheck[]}
        onDismiss={() => setBulkEditAction(null)}
        action={bulkEditAction}
        isOpen={bulkEditAction !== null}
        onSuccess={() => {
          // onCheckUpdate(true);
          appEvents.publish({
            type: AppEvents.alertSuccess.name,
            payload: ['All selected checks successfully updated'],
          });
          clearSelectedChecks();
        }}
        onError={(err) => {
          appEvents.publish({
            type: AppEvents.alertError.name,
            payload: [`There was an error updating checks: ${err}`],
          });
        }}
      />
    </div>
  );
}
