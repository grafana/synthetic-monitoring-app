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
  // The min step for most queries is a minimum of 1 minute. For uptime, however, we want to make sure we have steps of at least 5 minutes in order for the math to work out.
  const uptimeMinStep = getMinStep(minStep);

  const uptimeCalculationQueryV1 = `# the inner query is going to produce a non-zero value if there was at least one successful check during the 5 minute window
    # so make it a 1 if there was at least one success and a 0 otherwise
    ceil(
      # the number of successes across all probes
      sum by (instance, job) (increase(probe_all_success_sum{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval]))
      /
      # the total number of times we checked across all probes
      (sum by (instance, job) (increase(probe_all_success_count{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval])) + 1) # + 1 because we want to make sure it goes to 1, not 2
    )`;

  //The query to calculate the uptime doesn't return the expected result in all cases
  //For this reason we created a new version that we'll be progressively rolling out
  //See https://github.com/grafana/support-escalations/issues/11197#issuecomment-2307435564 for context and details.
  const uptimeCalculationQueryV2 = `floor(
      # Report a 1 if there's a location where most observations were successful and 0 if most observations failed for all probes.
      max by (instance, job) (
        round(
          # the number of successes for each probe
          (increase(probe_all_success_sum{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval]))
          /
          # the total number of times we checked for each probe
          ((increase(probe_all_success_count{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval])))
        )
      )
    )`;

  const uptimeQuery = newUptimeQuery ? uptimeCalculationQueryV2 : uptimeCalculationQueryV1;

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
