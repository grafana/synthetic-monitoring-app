import React, { useMemo } from 'react';
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
import { useStyles2 } from '@grafana/ui';

import { Table, TableColumn } from 'components/Table';

import { getTablePanelStyles } from '../getTablePanelStyles';
import { AssertionTableRow } from './AssertionsTableRow';

function getQueryRunner(logs: DataSourceRef) {
  const query = new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        refId: 'A',
        expr: `count_over_time (
          {job="$job", instance="$instance"}
          | logfmt check, value, msg
          | __error__ = ""
          | msg = "check result"
          | value = "1"
          | keep check
          [$__range]
        )
        / 
        count_over_time  (
            {job="$job", instance="$instance"}
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
          {job="$job", instance="$instance"}
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
          {job="$job", instance="$instance"}
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
  const { logs } = model.useState();
  const styles = useStyles2(getTablePanelStyles);

  const columns = useMemo<Array<TableColumn<DataRow>>>(() => {
    return [
      { name: 'Assertion', selector: (row) => row.name },
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
      { name: 'Success count', selector: (row) => row.successCount },
      { name: 'Failure count', selector: (row) => row.failureCount },
    ];
  }, []);

  const tableData = useMemo(() => {
    if (!data) {
      return [];
    }
    const fields = data.series[0]?.fields;
    return (
      fields?.[0].values.reduce<DataRow[]>((acc, name, index) => {
        const successRate = fields[1].values[index] * 100;
        const successCount = fields[2].values[index];
        const failureCount = fields[3].values[index];
        acc.push({ name, successRate, logs, successCount, failureCount });
        return acc;
      }, []) ?? []
    );
  }, [data, logs]);

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h6 title="Assertions" className={styles.title}>
          Assertions
        </h6>
      </div>
      <Table<DataRow>
        columns={columns}
        data={tableData}
        expandableRows
        dataTableProps={{
          expandableRowsComponentProps: { tableViz: model, logs },
        }}
        expandableComponent={AssertionTableRow}
        noDataText={'No assertions found'}
        pagination={false}
        id="assertion-table"
        name="Assertions"
        config={config}
      />
    </div>
  );
}

interface AssertionsTableState extends SceneObjectState {
  logs: DataSourceRef;
  expandedRows?: SceneObject[];
}

export class AssertionsTableSceneObject extends SceneObjectBase<AssertionsTableState> {
  static Component = AssertionsTable;
  public constructor(state: AssertionsTableState) {
    super(state);
  }
}

export function getAssertionTable(logs: DataSourceRef) {
  return new SceneFlexItem({
    body: new AssertionsTableSceneObject({
      $data: getQueryRunner(logs),
      logs,
      expandedRows: [],
    }),
  });
}
