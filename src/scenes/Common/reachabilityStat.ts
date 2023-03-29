import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: 'sum(\n  increase(probe_all_success_sum{instance="$instance", job="$job", probe=~"$probe"}[$__range])\n   )\n/\nsum(\n  increase(probe_all_success_count{instance="$instance", job="$job", probe=~"$probe"}[$__range])\n)',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'B',
      },
    ],
  });
}

export function getReachabilityStat(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  const queryRunner = getQueryRunner(variableSet, metrics);
  return new VizPanel({
    pluginId: 'stat',
    title: 'Reachability',
    description: 'The percentage of all the checks that have succeeded during the whole time period.',
    $data: queryRunner,
    placement: {
      height: 90,
    },
    fieldConfig: {
      overrides: [],
      defaults: {
        decimals: 2,
        // mappings: [
        //   {
        //     id: 0,
        //     op: '=',
        //     text: 'N/A',
        //     type: 1,
        //     value: 'null',
        //   },
        // ],
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'red',
              value: 0,
            },
            {
              color: '#EAB839',
              value: 0.99,
            },
            {
              color: 'green',
              value: 0.995,
            },
          ],
        },
        unit: 'percentunit',
      },
    },
  });
}
