import React, { useContext, useEffect, useState } from 'react';
import { Table } from '@grafana/cloud-features';
import { GrafanaTheme2 } from '@grafana/data';
import { config, PluginPage } from '@grafana/runtime';
import { SceneComponentProps, sceneGraph, SceneObjectBase } from '@grafana/scenes';
import { LoadingState } from '@grafana/schema';
import { Alert, Icon, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckFiltersType, FilteredCheck, ROUTES } from 'types';
import { ChecksContext } from 'contexts/ChecksContext';
import { useNavigation } from 'hooks/useNavigation';
import { CheckFilters, defaultFilters, getDefaultFilters } from 'components/CheckFilters';
import { AddNewCheckButton } from 'components/CheckList/AddNewCheckButton';
import { matchesAllFilters } from 'components/CheckList/checkFilters';
import ThresholdGlobalSettings from 'components/Thresholds/ThresholdGlobalSettings';

function getStyles(theme: GrafanaTheme2) {
  return {
    error: css`
      color: ${theme.colors.error.text};
      text-align: center;
    `,
    warning: css`
      color: ${theme.colors.warning.text};
      text-align: center;
    `,
    green: css`
      color: ${theme.colors.success.text};
      text-align: center;
    `,
    flex: css({
      display: 'flex',
    }),
    spaceBetween: css({
      display: 'flex',
      justifyContent: 'space-between',
    }),
  };
}

function SuccessStateValue({ value }: { value?: number }) {
  const styles = useStyles2(getStyles);
  if (value === undefined) {
    return <div> - </div>;
  }
  const percent = value * 100;
  if (percent === 100) {
    return <div className={styles.green}>{percent}%</div>;
  }
  let style;
  switch (true) {
    case percent > 99.5:
      style = styles.green;
      break;
    case percent > 99:
      style = styles.warning;
      break;
    case percent < 99:
    default:
      style = styles.error;
      break;
  }
  return <div className={style}>{percent.toFixed(2)}%</div>;
}

interface DataTableScriptedCheck extends Check {
  up?: number;
  uptime?: number;
  reachability?: number;
  notFound?: boolean;
}

export class ScriptedChecksListSceneObject extends SceneObjectBase {
  static Component = ScriptedCheckList;
}

export function ScriptedCheckList({ model }: SceneComponentProps<any>) {
  const navigate = useNavigation();
  const styles = useStyles2(getStyles);
  const { checks } = useContext(ChecksContext);
  const [filteredChecks, setFilteredChecks] = useState<FilteredCheck[] | []>([]);
  const [checkFilters, setCheckFilters] = useState<CheckFiltersType>(getDefaultFilters());
  const data = sceneGraph.getData(model).useState();

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
        return <SuccessStateValue value={row.uptime} />;
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
      <Table<DataTableScriptedCheck>
        id="scripted-checks-table"
        name="scripted-checks-table"
        noDataText="No scripted checks found"
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
    </div>
  );
}
