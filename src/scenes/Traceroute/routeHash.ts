import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: 'probe_traceroute_route_hash{probe=~"$probe", job="$job", instance="$instance"}',
        interval: '',
        legendFormat: '{{probe}}',
        refId: 'A',
        stepMode: 'min',
      },
    ],
  });
}

export function getRouteHashPanel(metrics: DataSourceRef) {
  const nodeGraph = new VizPanel({
    description:
      'Shows the hashed value of all the hosts traversed in a single traceroute. Can be used to determine the volatility of the routes over time',

    // $variables: variables,
    $data: getQueryRunner(metrics),
    title: 'Route hash',
    pluginId: 'timeseries',
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: 'line',
          lineInterpolation: 'linear',
          barAlignment: 0,
          lineWidth: 1,
          fillOpacity: 18,
          gradientMode: 'none',
          spanNulls: false,
          showPoints: 'auto',
          pointSize: 5,

          lineStyle: {
            fill: 'solid',
          },
        },
      },
      overrides: [],
    },
    options: {
      tooltip: {
        mode: 'single',
        sort: 'none',
      },
      legend: {
        showLegend: true,
        displayMode: 'list',
        placement: 'bottom',
        calcs: [],
      },
    },
  });
  return nodeGraph;
}
