import React, { useEffect } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AssertionsTableSceneObject, DataRow } from './AssertionsTable';
import { getSuccessOverTimeByProbe } from './successOverTimeByProbe';

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

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      padding: theme.spacing(2),
      background: theme.colors.background.canvas,
    }),
  };
}

export function AssertionTableRow({ data, tableViz, logs }: Props) {
  const { expandedRows } = tableViz?.useState() ?? {};
  const [rowKey, setRowKey] = React.useState<string | undefined>(undefined);
  const styles = useStyles2(getStyles);
  const rowScene = expandedRows?.find((scene) => scene.state.key === rowKey);

  useEffect(() => {
    if (!rowScene && logs && tableViz) {
      // const newRowScene = getErrorLogs(logs, data.name);
      const newRowScene = getSuccessOverTimeByProbe(logs, data.name);
      setRowKey(newRowScene.state.key);
      tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
    }
  }, [data.name, tableViz, rowScene, logs]);

  return <div className={styles.container}>{rowScene ? <rowScene.Component model={rowScene} /> : null}</div>;
}
