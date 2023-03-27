import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

const query = `
  100 * (
    1 - (
      sum(
        rate(probe_all_success_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
      )
      /
      sum(
        rate(probe_all_success_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
      )
    )
  )
`;

function getQueryRunner(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variables,
    queries: [
      {
        exemplar: true,
        expr: query,
        hide: false,
        interval: '1m',
        intervalFactor: 1,
        legendFormat: 'errors',
        refId: 'E',
      },
    ],
  });
}

export function getErrorRateTimeseries(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new VizPanel({
    pluginId: 'timeseries',
    title: 'Error Rate : $probe ⮕ $job / $instance',
    $data: getQueryRunner(variables, metrics),
    options: {
      yaxes: [
        {
          //       $$hashKey: 'object:254',
          //       decimals: null,
          format: 'percent',
          //       label: '',
          //       logBase: 1,
          //       max: '100',
          //       min: '0',
          //       show: true,
        },
        //     {
        //       $$hashKey: 'object:255',
        //       format: 'short',
        //       label: null,
        //       logBase: 1,
        //       max: null,
        //       min: null,
        //       show: true,
        //     },
      ],
    },
  });
}
