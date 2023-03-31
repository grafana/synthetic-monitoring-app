import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: '# find the average uptime over the entire time range evaluating \'up\' in 5 minute windows\navg_over_time(\n  (\n    # the inner query is going to produce a non-zero value if there was at least one successful check during the 5 minute window\n    # so make it a 1 if there was at least one success and a 0 otherwise\n    ceil(\n      # the number of successes across all probes\n      sum by (instance, job) (increase(probe_all_success_sum{instance="$instance", job="$job"}[5m]))\n      /\n      # the total number of times we checked across all probes\n      (sum by (instance, job) (increase(probe_all_success_count{instance="$instance", job="$job"}[5m])) + 1) # + 1 because we want to make sure it goes to 1, not 2\n    )\n  )\n  [$__range:5m]\n)',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'B',
      },
    ],
  });
}

export function getUptimeStat(metrics: DataSourceRef) {
  return new VizPanel({
    pluginId: 'stat',
    title: 'Uptime',
    description: 'The fraction of time the target was up during the whole period.',
    $data: getQueryRunner(metrics),
    placement: {
      // width: 200,
      height: 90,
    },
    fieldConfig: {
      defaults: {
        decimals: 2,
        // mappings: [
        //   {
        //     // op: '=',
        //     // text: 'N/A',
        //     type: MappingType.ValueToText,
        //     options: {
        //       [SpecialValueMatch.Empty]: {
        //         text: 'N/A',
        //       },
        //     },
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
