import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variables,
    queries: [
      {
        exemplar: true,
        expr: 'probe_traceroute_packet_loss_percent{instance="$instance", job="$job", probe=~"$probe"}',
        interval: '',
        legendFormat: '{{probe}}',
        refId: 'A',
        stepMode: 'min',
      },
    ],
  });
}

export function getPacketLossPanel(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new VizPanel({
    $data: getQueryRunner(variables, metrics),
    title: 'Overall packet loss',
    pluginId: 'timeseries',
    fieldConfig: {
      defaults: {
        unit: 'percentunit',
      },
      overrides: [],
    },
  });
}
