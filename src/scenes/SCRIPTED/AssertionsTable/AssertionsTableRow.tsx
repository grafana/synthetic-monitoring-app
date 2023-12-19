import React, { useEffect } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import {
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
} from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

import { AssertionsTableSceneObject, DataRow } from './AssertionsTable';

function assertionsTableItemQueryRunner(logs: DataSourceRef, name: string) {
  console.log('in the query runnter', { name });
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: `
          {job="$job", instance="$instance"} |
            logfmt |
            __error__ = "" |
            msg = "check result" |
            check="${name}" |
            line_format "{{.method}} {{.url}} ➜ {{ if eq .value \\"1\\" }}PASS{{else}}FAIL{{end}}: {{.check}}" |
            label_format level="{{ if eq .value \\"1\\" }}info{{else}}error{{end}}"`,
        refId: 'A',
      },
    ],
  });
}

function getAssertionLogs(logs: DataSourceRef, name: string) {
  // scene: new SceneFlexItem({
  console.log('halllo', logs);
  const flexItem = new SceneFlexLayout({
    width: '100%',
    height: 400,
    children: [
      new SceneFlexItem({
        body: new ExplorablePanel({
          $data: assertionsTableItemQueryRunner(logs, name),
          options: {
            showTime: true,
            showLabels: false,
            showCommonLabels: false,
            wrapLogMessage: true,
            prettifyLogMessage: false,
            enableLogDetails: true,
            dedupStrategy: 'none',
            sortOrder: 'Descending',
          },
          title: 'Logs for ' + name,
          pluginId: 'logs',

          // options: {
          //   showHeader: true,
          //   cellHeight: 'sm',
          //   footer: {
          //     show: false,
          //     reducer: ['sum'],
          //     countRows: false,
          //     fields: '',
          //   },
          // },
        }),
      }),
    ],
  });
  return flexItem;
}
export class AssertionsTableRowSceneObject extends SceneObjectBase<AssertionsTableRowState> {
  static Component = AssertionTableRow;

  public constructor(state: AssertionsTableRowState) {
    super(state);
  }
}

interface AssertionsTableRowState extends SceneObjectState {
  logs: DataSourceRef;
  job: string;
  instance: string;
  name: string;
}

interface Props extends ExpanderComponentProps<DataRow> {
  tableViz?: AssertionsTableSceneObject;
  logs?: DataSourceRef;
}

export function AssertionTableRow({ data, tableViz, logs }: Props) {
  const { expandedRows } = tableViz?.useState() ?? {};
  const [rowKey, setRowKey] = React.useState<string | undefined>(undefined);
  const rowScene = expandedRows?.find((scene) => scene.state.key === rowKey);

  useEffect(() => {
    if (!rowScene && logs && tableViz) {
      const newRowScene = getAssertionLogs(logs, data.name);
      setRowKey(newRowScene.state.key);
      tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
    }
  }, [data.name, tableViz, rowScene, logs]);

  return <div>{rowScene ? <rowScene.Component model={rowScene} /> : null}</div>;
}
