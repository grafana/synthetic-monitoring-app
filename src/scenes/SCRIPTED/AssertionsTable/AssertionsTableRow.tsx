import React, { useEffect } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { AssertionsTableSceneObject, DataRow } from './AssertionsTable';
import { getErrorLogs } from './errorLogs';

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
      const newRowScene = getErrorLogs(logs, data.name);
      setRowKey(newRowScene.state.key);
      tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
    }
  }, [data.name, tableViz, rowScene, logs]);

  return <div>{rowScene ? <rowScene.Component model={rowScene} /> : null}</div>;
}
