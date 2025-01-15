import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { UPTIME_DESCRIPTION } from 'components/constants';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getMinStep(minStep: string) {
  try {
    const minStepParsed = parseInt(minStep.slice(0, -1), 10);
    return `${Math.max(minStepParsed, 5)}m`;
  } catch (e) {
    return minStep;
  }
}

function getQueryRunner(metrics: DataSourceRef, minStep: string, newUptimeQuery: boolean) {
  const uptimeMinStep = getMinStep(minStep);
  const uptimeQuery = `clamp_max(sum(max_over_time(probe_success{job="$job", instance="$instance", probe=~"$probe"}[15s])), 1)`;

  const runner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        editorMode: 'code',
        exemplar: true,
        expr: uptimeQuery,
        hide: false,
        instant: false,
        interval: uptimeMinStep,
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

export function getUptimeStat(metrics: DataSourceRef, minStep: string, newUptimeQuery = false) {
  return new ExplorablePanel({
    pluginId: 'stat',
    title: 'Uptime',
    description: UPTIME_DESCRIPTION,
    $data: getQueryRunner(metrics, minStep, newUptimeQuery),
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
