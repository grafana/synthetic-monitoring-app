import React, { useEffect, useMemo } from 'react';
import { DataQueryError, LoadingState } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  SceneComponentProps,
  SceneDataTransformer,
  SceneFlexItem,
  sceneGraph,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
} from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { Alert, LinkButton, LoadingPlaceholder, useStyles2 } from '@grafana/ui';

import { CheckType } from 'types';
import { Table, TableColumn } from 'components/Table';
import { getMinStepFromFrequency } from 'scenes/utils';

import { getTablePanelStyles } from '../../SCRIPTED/getTablePanelStyles';
import { AssertionTableRow } from './AssertionsTableRow';

function getQueryRunner(logs: DataSourceRef) {
  const query = new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        refId: 'A',
        expr: `count_over_time (
          {job="$job", instance="$instance", probe=~"$probe"}
          | logfmt check, value, msg
          | __error__ = ""
          | msg = "check result"
          | value = "1"
          | keep check
          [$__range]
        )
        / 
        count_over_time (
            {job="$job", instance="$instance", probe=~"$probe"}
            | logfmt check, msg
            | __error__ = ""
            | msg = "check result"
            | keep check
            [$__range]
          )
        `,
        queryType: 'instant',
      },
      {
        refId: 'B',
        expr: `count_over_time (
          {job="$job", instance="$instance", probe=~"$probe"}
          | logfmt check, value, msg
          | __error__ = ""
          | msg = "check result"
          | value = "1"
          | keep check
          [$__range]
        )
        `,
        queryType: 'instant',
      },
      {
        refId: 'C',
        expr: `count_over_time (
          {job="$job", instance="$instance", probe=~"$probe"}
          | logfmt check, value, msg
          | __error__ = ""
          | msg = "check result"
          | value = "0"
          | keep check
          [$__range]
        )
      `,
        queryType: 'instant',
      },
    ],
  });

  return new SceneDataTransformer({
    $data: query,
    transformations: [
      {
        id: 'joinByField',
        options: {
          byField: 'check',
          mode: 'outer',
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            'Time 1': true,
            'Time 2': true,
            'Time 3': true,
          },
          indexByName: {},
          renameByName: {
            'Value #A': 'Success rate',
            'Value #B': 'Success count',
            'Value #C': 'Failure count',
          },
        },
      },
    ],
  });
}

export interface DataRow {
  name: string;
  successRate: number;
  logs: DataSourceRef;
  successCount: number;
  failureCount: number;
}

function AssertionsTable({ model }: SceneComponentProps<AssertionsTableSceneObject>) {
  const { data } = sceneGraph.getData(model).useState();
  const { logs, checkType, minStep } = model.useState();
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [hasStartedLoading, setHasStartedLoading] = React.useState(false);
  const [logTimeLimitExceeded, setLogTimeLimitExceeded] = React.useState(false);
  const [logRetentionLimit, setLogRetentionLimit] = React.useState<string>();
  const styles = useStyles2(getTablePanelStyles);

  useEffect(() => {
    // This is a hack because the data Loading state initializes as "Done", then goes to "Loading", and then goes back to "Done"
    if (data?.state === LoadingState.Loading) {
      setHasStartedLoading(true);
      setLogTimeLimitExceeded(false);
    }
    if (data?.state === LoadingState.Done && hasStartedLoading && !hasLoaded) {
      setHasLoaded(true);
    }
    // Detect if the time range is beyond the retention period of logs
    if (data?.state === LoadingState.Error && hasLimitExceededError(data.errors)) {
      const limit = getLogRetentionLimit(data.errors);
      setLogRetentionLimit(limit);
      setLogTimeLimitExceeded(true);
      setHasLoaded(true);
    }
  }, [data, hasLoaded, hasStartedLoading]);

  const columns = useMemo<Array<TableColumn<DataRow>>>(() => {
    return [
      { name: 'Assertion', selector: (row) => row.name },
      {
        name: 'Success',
        selector: (row) => {
          let successRate;
          if (isNaN(row.successRate) || row.successRate === 0) {
            successRate = '0%';
          } else if (row.successRate === 100) {
            successRate = '100%';
          } else {
            successRate = row.successRate.toFixed(2) + '%';
          }
          return successRate;
        },
      },
      { name: 'Success count', selector: (row) => row.successCount },
      { name: 'Failure count', selector: (row) => row.failureCount },
    ];
  }, []);

  const tableData = useMemo(() => {
    if (!data || (data.errors && data.errors.length > 0)) {
      return [];
    }
    const fields = data.series[0]?.fields;
    const name = fields?.find((field) => field.name === 'check');
    const successRateField = fields?.find((field) => field.config.displayName === 'Success rate');
    const successCountField = fields?.find((field) => field.config.displayName === 'Success count');
    const failureCountField = fields?.find((field) => field.config.displayName === 'Failure count');
    if (!name) {
      return [];
    }
    return (
      name.values.reduce<DataRow[]>((acc, name, index) => {
        const successRate = successRateField?.values?.[index] * 100;
        const successCount = successCountField?.values?.[index] ?? 0;
        const failureCount = failureCountField?.values?.[index] ?? 0;
        acc.push({ name, successRate, logs, successCount, failureCount });
        return acc;
      }, []) ?? []
    );
  }, [data, logs]);

  const getPlaceholder = (state: LoadingState | undefined, errors?: DataQueryError[]) => {
    if (!hasLoaded) {
      return <LoadingPlaceholder text="Loading assertions..." />;
    }
    if (state === LoadingState.Error) {
      return (
        <div className={styles.noDataContainer}>
          <Alert severity="error" title="Error loading assertions">
            {errors?.map((error) => error.message + '\n') ?? 'Unknown error'}
          </Alert>
        </div>
      );
    }
    return (
      <div className={styles.noDataContainer}>
        {checkType === CheckType.Scripted || checkType === CheckType.Browser ? (
          <p>There are no assertions in this script. You can use k6 Checks to validate conditions in your script.</p>
        ) : (
          <p>There are no assertions in the check. You can use assertions to validate conditions in your check</p>
        )}

        <LinkButton
          variant="primary"
          href={
            checkType === CheckType.Scripted || checkType === CheckType.Browser
              ? 'https://grafana.com/docs/k6/latest/using-k6/checks/'
              : 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/multihttp/#assertions'
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more about Checks
        </LinkButton>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h6 title="Assertions" className={styles.title}>
          Assertions
        </h6>
      </div>
      {logTimeLimitExceeded ? (
        <div className={styles.noDataContainer}>
          <Alert severity="warning" title="Time range beyond retention">
            The query that powers this panel is based on logs and the time range selected is beyond the retention period
            of logs. In order to see data, select a time range less than {logRetentionLimit ?? '31 days'}
          </Alert>
        </div>
      ) : (
        <Table<DataRow>
          columns={columns}
          data={tableData}
          expandableRows
          dataTableProps={{
            expandableRowsComponentProps: { tableViz: model, logs, minStep },
          }}
          expandableComponent={AssertionTableRow}
          //@ts-ignore - noDataText expects a string, but we want to render a component and it works
          noDataText={getPlaceholder(data?.state, data?.errors)}
          pagination={false}
          id="assertion-table"
          name="Assertions"
          config={config}
        />
      )}
    </div>
  );
}

function getLogRetentionLimit(errors?: DataQueryError[]) {
  if (errors) {
    for (const error of errors) {
      if (error.message?.includes('max_query_lookback')) {
        const limit = error.message.split('max_query_lookback ')?.[1]?.replace(/\(|\)/g, '');
        return limit;
      }
    }
  }
  return;
}

function hasLimitExceededError(errors?: DataQueryError[]) {
  return errors?.some((error) =>
    error.message?.includes('this data is no longer available, it is past now - max_query_lookback')
  );
}

interface AssertionsTableState extends SceneObjectState {
  logs: DataSourceRef;
  checkType: CheckType;
  expandedRows?: SceneObject[];
  minStep: string;
}

export class AssertionsTableSceneObject extends SceneObjectBase<AssertionsTableState> {
  static Component = AssertionsTable;
  public constructor(state: AssertionsTableState) {
    super(state);
  }
}

export function getAssertionTable(logs: DataSourceRef, checkType: CheckType, frequency: number) {
  const minStep = getMinStepFromFrequency(frequency, 2);
  return new SceneFlexItem({
    body: new AssertionsTableSceneObject({
      $data: getQueryRunner(logs),
      checkType,
      logs,
      expandedRows: [],
      minStep,
    }),
  });
}
