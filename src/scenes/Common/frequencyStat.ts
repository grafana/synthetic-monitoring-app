import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
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

export function getFrequencyStat(metrics: DataSourceRef) {
  const queryRunner = getQueryRunner(metrics);
  return new VizPanel({
    pluginId: 'stat',
    title: 'Frequency',
    description: 'How often is the target checked?',
    $data: queryRunner,
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
