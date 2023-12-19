import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
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
import { css } from '@emotion/css';

import { Table, TableColumn } from 'components/Table';

import { AssertionTableRow } from './AssertionsTableRow';

function getQueryRunner(logs: DataSourceRef) {
  const query = new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        editorMode: 'code',
        expr: `
          sum (
              min_over_time (
                  {job="$job", instance="$instance"}
                  | logfmt method, url, check, value, msg
                  | __error__ = ""
                  | msg = "check result"
                  | unwrap value
                  [$__range]
              )
          ) by (method, url, check)
          /
          count (
              min_over_time (
                  {job="$job", instance="$instance"}
                  | logfmt method, url, check, value, msg
                  | __error__ = ""
                  | msg = "check result"
                  | unwrap value
                  [$__range]
              )
          ) by (method, url, check)`,
        queryType: 'instant',
        refId: 'A',
      },
    ],
  });

  return new SceneDataTransformer({
    $data: query,
    transformations: [
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
          },
          indexByName: {},
          renameByName: {
            'Value #A': 'success rate',
          },
        },
      },
    ],
  });
}

function getStyles(theme: GrafanaTheme2) {
  return {
    tableContainer: css({
      width: '100%',
      overflowY: 'scroll',
    }),
    expandedRow: css({
      height: '300px',
    }),
  };
}

export interface DataRow {
  name: string;
  successRate: string;
  logs: DataSourceRef;
}

function AssertionsTable({ model }: SceneComponentProps<AssertionsTableSceneObject>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const { logs } = model.useState();

  const columns = useMemo<Array<TableColumn<DataRow>>>(() => {
    return [
      { name: 'Assertion', selector: (row) => row.name },
      { name: 'Success', selector: (row) => row.successRate },
    ];
  }, []);

  const tableData = useMemo(() => {
    if (!data) {
      return [];
    }
    const fields = data.series[0]?.fields;
    return (
      fields?.[0].values.reduce<DataRow[]>((acc, name, index) => {
        let successRate;
        const percent = fields[1].values[index] * 100;
        if (isNaN(percent)) {
          successRate = 'N/A';
        } else {
          successRate = percent.toFixed(2) + '%';
        }

        acc.push({ name, successRate, logs });
        return acc;
      }, []) ?? []
    );
  }, [data, logs]);

  return (
    <div className={styles.tableContainer}>
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
