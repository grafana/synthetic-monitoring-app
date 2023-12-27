import React, { useEffect } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { SceneFlexLayout } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { getExpectedResponse } from '../expectedResponse';
import { getDurationByTargetProbe } from './durationByTargetProbe';
import { getLatencyByPhaseTarget } from './latencyByPhaseTarget';
import { DataRow, ResultsByTargetTableSceneObject } from './ResultByTargetTable';
import { getSuccessRateByTargetProbe } from './successRateByTargetProbe';

function getResultsByTargetRowScene(metrics: DataSourceRef, name: string) {
  const flexItem = new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexLayout({
        width: '100%',
        height: 250,
        children: [getSuccessRateByTargetProbe(metrics, name), getExpectedResponse(metrics, name)],
      }),
      new SceneFlexLayout({
        width: '100%',
        height: 250,
        children: [getDurationByTargetProbe(metrics, name), getLatencyByPhaseTarget(metrics, name)],
      }),
    ],
  });
  return flexItem;
}

interface Props extends ExpanderComponentProps<DataRow> {
  tableViz?: ResultsByTargetTableSceneObject;
  metrics?: DataSourceRef;
}

export function ResultsByTargetTableRow({ data, tableViz, metrics }: Props) {
  const { expandedRows } = tableViz?.useState() ?? {};
  const [rowKey, setRowKey] = React.useState<string | undefined>(undefined);
  const rowScene = expandedRows?.find((scene) => scene.state.key === rowKey);

  useEffect(() => {
    if (!rowScene && metrics && tableViz) {
      const newRowScene = getResultsByTargetRowScene(metrics, data.name);
      setRowKey(newRowScene.state.key);
      tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
    }
  }, [data.name, tableViz, rowScene, metrics]);

  return <div>{rowScene ? <rowScene.Component model={rowScene} /> : null}</div>;
}