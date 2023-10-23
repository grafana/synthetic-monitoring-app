import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';
import { REACHABILITY_DESCRIPTION } from 'components/constants';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  const queries = [
    {
      exemplar: true,
      expr: 'sum(\n  increase(probe_all_success_sum{instance="$instance", job="$job", probe=~"$probe"}[$__range])\n   )\n/\nsum(\n  increase(probe_all_success_count{instance="$instance", job="$job", probe=~"$probe"}[$__range])\n)',
      hide: false,
      instant: true,
      interval: '',
      legendFormat: '',
      refId: 'reachabilityStat',
    },
  ];
  const runner = new SceneQueryRunner({
    datasource: metrics,
    queries,
  });
  return {
    queries,
    runner,
  };
}

export function getReachabilityStat(metrics: DataSourceRef) {
  const { runner } = getQueryRunner(metrics);
  return new ExplorablePanel({
    pluginId: 'stat',
    title: 'Reachability',
    description: REACHABILITY_DESCRIPTION,
    $data: runner,
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
