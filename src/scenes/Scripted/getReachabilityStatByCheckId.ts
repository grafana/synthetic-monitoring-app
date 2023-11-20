import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { Check } from 'types';
import { REACHABILITY_DESCRIPTION } from 'components/constants';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, check?: Check) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: `sum(
          increase(probe_all_success_sum{instance="${check?.target}", job="${check?.job}"}[$__range])
        )
        /
        sum(
          increase(probe_all_success_count{instance="${check?.target}", job="${check?.job}"}[$__range])
        )`,
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'reachabilityStat',
      },
    ],
  });
}

export function getReachabilityStatByCheckId(metrics: DataSourceRef, check?: Check) {
  return new ExplorablePanel({
    pluginId: 'stat',
    title: 'Reachability',
    description: REACHABILITY_DESCRIPTION,
    $data: getQueryRunner(metrics, check),
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
