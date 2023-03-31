import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
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

export function getPacketLossPanel(metrics: DataSourceRef) {
  return new VizPanel({
    $data: getQueryRunner(metrics),
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
