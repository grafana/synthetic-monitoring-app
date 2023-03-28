import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variableSet,
    queries: [
      {
        expr: `sum by (frequency) (
          topk(
              1,
              sm_check_info{instance="$instance", job="$job", probe=~"$probe"}
          )
        )`,
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
    $variables: variableSet,
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
        unit: 'ms',
      },
      overrides: [],
    },
  });
}
