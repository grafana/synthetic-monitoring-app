import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { UPTIME_DESCRIPTION } from 'components/constants';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, minStep: string) {
  const runner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        editorMode: 'code',
        exemplar: true,
        expr: `# the inner query is going to produce a non-zero value if there was at least one successful check during the 5 minute window
        # so make it a 1 if there was at least one success and a 0 otherwise
        ceil(
          # the number of successes across all probes
          sum by (instance, job) (increase(probe_all_success_sum{instance="$instance", job="$job"}[$rate_interval]))
          /
          # the total number of times we checked across all probes
          (sum by (instance, job) (increase(probe_all_success_count{instance="$instance", job="$job"}[$rate_interval])) + 1) # + 1 because we want to make sure it goes to 1, not 2
        )`,
        hide: false,
        instant: false,
        interval: minStep,
        legendFormat: '',
        range: true,
        refId: 'B',
      },
    ],
  });

  return new SceneDataTransformer({
    $data: runner,
    transformations: [
      {
        id: 'reduce',
        options: {
          reducers: ['mean'],
        },
      },
    ],
  });
}

export function getUptimeStat(metrics: DataSourceRef, minStep: string) {
  return new ExplorablePanel({
    pluginId: 'stat',
    title: 'Uptime',
    description: UPTIME_DESCRIPTION,
    $data: getQueryRunner(metrics, minStep),
    fieldConfig: {
      defaults: {
        decimals: 2,
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
      overrides: [],
    },

    options: {
      colorMode: 'value',
      fieldOptions: {
        calcs: ['lastNotNull'],
      },
      graphMode: 'none',
      justifyMode: 'auto',
      orientation: 'horizontal',
      reduceOptions: {
        calcs: ['mean'],
        fields: '',
        values: false,
      },
      text: {},
      textMode: 'auto',
    },
  });
}
