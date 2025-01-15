import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { UPTIME_DESCRIPTION } from 'components/constants';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, frequency: number) {
  const minStep = getSecondsFromFrequency(frequency);
  const uptimeQuery = `clamp_max(sum(max_over_time(probe_success{job="$job", instance="$instance", probe=~"$probe"}[${minStep}])), 1)`;

  const runner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        editorMode: 'code',
        exemplar: true,
        expr: uptimeQuery,
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

export function getUptimeStat(metrics: DataSourceRef, frequency: number) {
  return new ExplorablePanel({
    pluginId: 'stat',
    title: 'Uptime',
    description: UPTIME_DESCRIPTION,
    $data: getQueryRunner(metrics, frequency),
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

function getSecondsFromFrequency(frequency: number) {
  return `${frequency / 1000}s`;
}
