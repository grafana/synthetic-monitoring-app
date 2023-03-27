import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variableSet,
    queries: [
      {
        // exemplar: true,
        expr: `sum by (frequency) (
          topk(
              1,
              sm_check_info{instance="$instance", job="$job", probe=~"$probe"}
          )
        )`,
        // format: 'time_series',
        // instant: true,
        // interval: '',
        // legendFormat: '',
        // queryType: 'randomWalk',
        refId: 'D',
      },
    ],
  });
}

export function getFrequencyStat(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  const queryRunner = getQueryRunner(variableSet, metrics);
  return new VizPanel({
    pluginId: 'stat',
    title: 'Frequency',
    description: 'How often is the target checked?',
    $data: queryRunner,
    placement: {
      height: 90,
    },
    fieldConfig: {
      defaults: {
        color: {
          fixedColor: 'green',
          mode: 'fixed',
        },
        mappings: [],
        noValue: 'N/A',
        // thresholds: {
        //   mode: ThresholdsMode.Absolute,
        //   steps: [
        //     {
        //       color: 'green',
        //       value: 0,
        //     },
        //   ],
        // },
        unit: 'ms',
      },
      overrides: [],
    },
  });
}
