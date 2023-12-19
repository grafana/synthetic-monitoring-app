import React, { useEffect } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

import { DataRow, ResultsByTargetTableSceneObject } from './ResultByTargetTable';

function resultsByTargetRowQueryRunner(metrics: DataSourceRef, name: string) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `sum by (probe) (probe_http_total_duration_seconds{probe=~".*", job="$job", instance="$instance", name="${name}"})`,
        refId: 'A',
      },
    ],
  });
}

function getResultsByTargetRowScene(metrics: DataSourceRef, name: string) {
  const flexItem = new SceneFlexLayout({
    width: '100%',
    height: 400,
    children: [
      new SceneFlexItem({
        body: new ExplorablePanel({
          $data: resultsByTargetRowQueryRunner(metrics, name),
          options: {
            instant: false,
          },
          fieldConfig: {
            defaults: {
              unit: 's',
            },
            overrides: [],
          },
          title: 'Duration by probe for ' + name,
          pluginId: 'timeseries',
        }),
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
