import React, { useEffect, useMemo } from 'react';
import { TableColumn } from 'react-data-table-component';
import { DataQueryError, dateTimeParse, LoadingState } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  SceneComponentProps,
  SceneFlexItem,
  sceneGraph,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { Alert, LinkButton, LoadingPlaceholder, useStyles2 } from '@grafana/ui';

import { CheckType } from 'types';
import { Table } from 'components/Table';

import { getTablePanelStyles } from '../getTablePanelStyles';
import { getQueryRunner } from './resultsByTargetTableQueries';
import { ResultsByTargetTableRow } from './ResultsByTargetTableRow';
import { findValueByName, getValueFieldName, RESULTS_BY_TARGET_TABLE_REF_ID } from './utils';

interface ResultsByTargetTableState extends SceneObjectState {
  metrics: DataSourceRef;
  expandedRows?: SceneObject[];
  checkType: CheckType;
}

export interface DataRow {
  name: string;
  method: string;
  expectedResponse: number;
  successRate: number;
  latency: number;
  metrics: DataSourceRef;
}

const ResultsByTargetTableComponent = ({ model }: SceneComponentProps<ResultsByTargetTableSceneObject>) => {
  const { data } = sceneGraph.getData(model).useState();
  const { value: timeRange } = sceneGraph.getTimeRange(model).useState();
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [hasStartedLoading, setHasStartedLoading] = React.useState(false);
  const [logTimeLimitExceeded, setLogTimeLimitExceeded] = React.useState(false);
  const { metrics, checkType } = model.useState();
  const styles = useStyles2(getTablePanelStyles);

  useEffect(() => {
    const logQueryLimit = new Date().setDate(new Date().getDate() - 31);
    const from = dateTimeParse(timeRange.from);
    if (from.valueOf() < logQueryLimit) {
      setLogTimeLimitExceeded(true);
    } else if (logTimeLimitExceeded) {
      setLogTimeLimitExceeded(false);
    }
  }, [timeRange.from, logTimeLimitExceeded]);

  useEffect(() => {
    // This is a hack because the data Loading state initializes as "Done", then goes to "Loading", and then goes back to "Done"
    if (data?.state === LoadingState.Loading) {
      setHasStartedLoading(true);
    }
    if (data?.state === LoadingState.Done && hasStartedLoading && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [data, hasLoaded, hasStartedLoading]);

  const columns = useMemo<Array<TableColumn<DataRow>>>(() => {
    return [
      { name: 'URL', selector: (row) => row.name },
      { name: 'Method', selector: (row) => row.method },
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
      {
        name: 'Expected response',
        selector: (row) => {
          let expectedResponse;
          if (isNaN(row.expectedResponse)) {
            expectedResponse = 'N/A';
          } else if (row.expectedResponse === 0) {
            expectedResponse = '0%';
          } else if (row.expectedResponse === 100) {
            expectedResponse = '100%';
          } else {
            expectedResponse = row.expectedResponse.toFixed(2) + '%';
          }
          return expectedResponse;
        },
      },
      {
        name: 'Latency',
        selector: (row) => {
          if (isNaN(row.latency)) {
            return 'N/A';
          }
          return (row.latency * 1000).toFixed(0) + 'ms';
        },
      },
    ];
  }, []);

  const tableData = useMemo(() => {
    if (!data || (data.errors && data.errors.length > 0) || !data.series?.[0]) {
      return [];
    }
    const expectedResponseSeries = data.series.find(
      (series) => series.refId === RESULTS_BY_TARGET_TABLE_REF_ID.EXPECTED_RESPONSE
    );
    const latencySeries = data.series.find((series) => series.refId === RESULTS_BY_TARGET_TABLE_REF_ID.LATENCY);
    const successRateSeries = data.series.find(
      (series) => series.refId === RESULTS_BY_TARGET_TABLE_REF_ID.SUCCESS_RATE
    );
    if (!successRateSeries || !expectedResponseSeries || !latencySeries) {
      return [];
    }
    const namesIndex = successRateSeries.fields?.findIndex((field) => field.name === 'name' || field.name === 'url');
    const successRateNamesField = successRateSeries?.fields?.[namesIndex];
    const methodIndex = successRateSeries.fields?.findIndex((field) => field.name === 'method');
    const successRateMethodField = successRateSeries.fields?.[methodIndex];
    if (!successRateNamesField || !successRateMethodField) {
      return [];
    }
    return (
      successRateNamesField.values.reduce<DataRow[]>((acc, name, index) => {
        const method = successRateMethodField.values?.[index] ?? '';
        const successRate =
          (1 -
            findValueByName(
              name,
              method,
              getValueFieldName(RESULTS_BY_TARGET_TABLE_REF_ID.SUCCESS_RATE),
              successRateSeries?.fields ?? []
            )) *
          100;
        const expectedResponse =
          findValueByName(
            name,
            method,
            getValueFieldName(RESULTS_BY_TARGET_TABLE_REF_ID.EXPECTED_RESPONSE),
            expectedResponseSeries?.fields ?? []
          ) * 100;
        const latency = findValueByName(
          name,
          method,
          getValueFieldName(RESULTS_BY_TARGET_TABLE_REF_ID.LATENCY),
          latencySeries?.fields ?? []
        );

        acc.push({ name, method, successRate, latency, expectedResponse, metrics });
        return acc;
      }, []) ?? []
    );
  }, [data, metrics]);

  const getPlaceholder = (state: LoadingState | undefined, errors?: DataQueryError[]) => {
    if (!hasLoaded) {
      return <LoadingPlaceholder text="Loading results by URL..." />;
    }
    if (state === LoadingState.Error) {
      return (
        <div className={styles.noDataContainer}>
          <Alert severity="error" title="Error loading URL results">
            {errors?.map((error) => error.message + '\n') ?? 'Unknown error'}
          </Alert>
        </div>
      );
    }
    return (
      <div className={styles.noDataContainer}>
        <p>There were no requests made in this script.</p>
        <LinkButton
          variant="primary"
          href="https://k6.io/docs/using-k6/http-requests/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more about making requests
        </LinkButton>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h6 title="Results by URL" className={styles.title}>
          Results by URL
        </h6>
      </div>
      {logTimeLimitExceeded ? (
        <div className={styles.noDataContainer}>
          <Alert severity="warning" title="Time range beyond retention">
            The query that powers this panel is based on logs and the time range selected is beyond the retention period
            of logs. In order to see data, select a time range less than 31 days.
          </Alert>
        </div>
      ) : (
        <Table<DataRow>
          columns={columns}
          data={tableData}
          className={styles.table}
          expandableRows
          dataTableProps={{
            expandableRowsComponentProps: { tableViz: model, metrics, checkType },
          }}
          expandableComponent={ResultsByTargetTableRow}
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
};

export class ResultsByTargetTableSceneObject extends SceneObjectBase<ResultsByTargetTableState> {
  static Component = ResultsByTargetTableComponent;

  public constructor(state: ResultsByTargetTableState) {
    super(state);
  }
}

export function getResultsByTargetTable(metrics: DataSourceRef, checkType: CheckType) {
  return new SceneFlexItem({
    maxWidth: '100%',
    body: new ResultsByTargetTableSceneObject({
      $data: getQueryRunner(metrics, checkType),
      metrics,
      expandedRows: [],
      checkType,
    }),
  });
}
