import React, { useMemo } from 'react';
import { TableColumn } from 'react-data-table-component';
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
import { DataSourceRef } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';

import { Table } from 'components/Table';

import { getTablePanelStyles } from '../getTablePanelStyles';
import { ResultsByTargetTableRow } from './ResultsByTargetTableRow';

interface ResultsByTargetTableState extends SceneObjectState {
  metrics: DataSourceRef;
  expandedRows?: SceneObject[];
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
    const { metrics } = model.useState();
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
      if (!data) {
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
            expandableRowsComponentProps: { tableViz: model, metrics },
          }}
          expandableComponent={ResultsByTargetTableRow}
          noDataText={'No requests found'}
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

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    queries: [
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          sum by (name) (probe_http_requests_total{job="$job", instance="$instance"})
          /
          count by (name) (probe_http_requests_total{job="$job", instance="$instance"})`,
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
          sum by (name) (probe_http_got_expected_response{job="$job", instance="$instance"})
          /
          count by (name)(probe_http_got_expected_response{job="$job", instance="$instance"})`,
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
        expr: `avg by (name) (sum by(name, probe)(rate(probe_http_duration_seconds{job="$job", instance="$instance"}[5m])))`,
        format: 'table',
        hide: false,
        instant: true,
        range: false,
        refId: 'C',
      },
    ],
  });
}

export function getResultsByTargetTable(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new ResultsByTargetTableSceneObject({
      $data: getQueryRunner(metrics),
      metrics,
      expandedRows: [],
    }),
  });
}
