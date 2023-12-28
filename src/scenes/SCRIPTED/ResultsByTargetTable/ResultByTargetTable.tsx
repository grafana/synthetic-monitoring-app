import React, { useMemo } from 'react';
import { TableColumn } from 'react-data-table-component';
import { DataQueryError } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  SceneComponentProps,
  SceneFlexItem,
  sceneGraph,
  SceneObject,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
} from '@grafana/scenes';
import { DataSourceRef, LoadingState } from '@grafana/schema';
import { Alert, LinkButton, LoadingPlaceholder, useStyles2 } from '@grafana/ui';

import { CheckType } from 'types';
import { Table } from 'components/Table';

import { getTablePanelStyles } from '../getTablePanelStyles';
import { ResultsByTargetTableRow } from './ResultsByTargetTableRow';

interface ResultsByTargetTableState extends SceneObjectState {
  metrics: DataSourceRef;
  expandedRows?: SceneObject[];
  checkType: CheckType;
}

export interface DataRow {
  name: string;
  expectedResponse: number;
  successRate: number;
  latency: number;
  metrics: DataSourceRef;
}

export class ResultsByTargetTableSceneObject extends SceneObjectBase<ResultsByTargetTableState> {
  static Component = ({ model }: SceneComponentProps<ResultsByTargetTableSceneObject>) => {
    const { data } = sceneGraph.getData(model).useState();
    const { metrics, checkType } = model.useState();
    const styles = useStyles2(getTablePanelStyles);

    const columns = useMemo<Array<TableColumn<DataRow>>>(() => {
      return [
        { name: 'URL', selector: (row) => row.name },
        {
          name: 'Success',
          selector: (row) => {
            let successRate;
            if (isNaN(row.successRate)) {
              successRate = 'N/A';
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
            } else {
              expectedResponse = row.expectedResponse.toFixed(2) + '%';
            }
            return expectedResponse;
          },
        },
        {
          name: 'Latency',
          selector: (row) => {
            return (row.latency * 1000).toFixed(2) + 'ms';
          },
        },
      ];
    }, []);

    const tableData = useMemo(() => {
      if (!data || (data.errors && data.errors.length > 0)) {
        return [];
      }
      const fields = data.series[0]?.fields;
      return (
        fields?.[1].values.reduce<DataRow[]>((acc, name, index) => {
          const successRate = fields?.[2]?.values?.[index] * 100;
          const expectedResponse = data.series?.[1]?.fields?.[2]?.values?.[index] * 100;
          const latency = data.series?.[2]?.fields?.[2]?.values?.[index] * 100;

          acc.push({ name, successRate, latency, expectedResponse, metrics });
          return acc;
        }, []) ?? []
      );
    }, [data, metrics]);

    const getPlaceholder = (state: LoadingState | undefined, errors?: DataQueryError[]) => {
      if (!state || state === LoadingState.NotStarted || state === LoadingState.Loading) {
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
        <Table<DataRow>
          columns={columns}
          data={tableData}
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
      </div>
    );
  };

  public constructor(state: ResultsByTargetTableState) {
    super(state);
  }
}

function getQueryRunner(metrics: DataSourceRef, checkType: CheckType) {
  const label = checkType === CheckType.K6 ? 'name' : 'url';
  return new SceneQueryRunner({
    queries: [
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          sum by (${label}) (probe_http_requests_total{job="$job", instance="$instance"})
          /
          count by (${label}) (probe_http_requests_total{job="$job", instance="$instance"})`,
        format: 'table',
        instant: true,
        legendFormat: '__auto',
        range: false,
        refId: 'A',
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          sum by (${label}) (probe_http_got_expected_response{job="$job", instance="$instance"})
          /
          count by (${label})(probe_http_got_expected_response{job="$job", instance="$instance"})`,
        format: 'table',
        instant: true,
        legendFormat: '__auto',
        range: false,
        refId: 'B',
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        // TODO: Does this make sense at all? I want get the total latency for each URL and then average the different probes, not just sum all the probes together
        expr: `avg by (${label}) (sum by(${label}, probe)(rate(probe_http_duration_seconds{job="$job", instance="$instance"}[5m])))`,
        format: 'table',
        hide: false,
        instant: true,
        range: false,
        refId: 'C',
      },
    ],
  });
}

export function getResultsByTargetTable(metrics: DataSourceRef, checkType: CheckType) {
  return new SceneFlexItem({
    body: new ResultsByTargetTableSceneObject({
      $data: getQueryRunner(metrics, checkType),
      metrics,
      expandedRows: [],
      checkType,
    }),
  });
}
