import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variables,
    queries: [
      {
        exemplar: true,
        expr: 'probe_traceroute_total_hops{instance="$instance", job="$job", probe=~"$probe"}',
        interval: '',
        legendFormat: '{{probe}}',
        refId: 'A',
        stepMode: 'min',
      },
    ],
  });
}

export function getAverageHopsPanel(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new VizPanel({
    $data: getQueryRunner(variables, metrics),
    title: 'Average Total Hops',
    pluginId: 'bargauge',
    options: {
      reduceOptions: {
        values: false,
        calcs: ['lastNotNull'],
        fields: '',
      },
      orientation: 'horizontal',
      displayMode: 'gradient',
      showUnfilled: true,
      minVizWidth: 0,
      minVizHeight: 10,
      text: {},
    },
  });
}
