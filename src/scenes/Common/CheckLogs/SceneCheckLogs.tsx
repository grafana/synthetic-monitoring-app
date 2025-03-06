import React from 'react';
import {
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
} from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { CheckLogsSeries } from 'features/parseCheckLogs/checkLogs.types';
import { CheckLogs } from 'scenes/Common/CheckLogs/CheckLogs';

function getQueryRunner(logs: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: '{probe=~"$probe", instance="$instance", job="$job"} | logfmt',
        refId: 'A',
      },
    ],
  });
}

export function getCheckLogs(logs: DataSourceRef) {
  return new SceneFlexLayout({
    $data: getQueryRunner(logs),
    children: [
      new SceneFlexItem({
        body: new ParsedLogs({}),
      }),
    ],
  });
}

interface CustomObjectState extends SceneObjectState {}

class ParsedLogs extends SceneObjectBase<CustomObjectState> {
  static Component = CustomObjectRenderer;
}

function CustomObjectRenderer({ model }: SceneComponentProps<ParsedLogs>) {
  const { data } = sceneGraph.getData(model).useState();

  if (data?.series?.[0]?.fields) {
    const series = data.series[0] as CheckLogsSeries;

    return <CheckLogs series={series} timeRange={data.timeRange} />;
  }

  return null;
}
