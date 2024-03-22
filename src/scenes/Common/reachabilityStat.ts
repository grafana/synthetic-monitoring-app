import { SpecialValueMatch } from '@grafana/data';
import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, MappingType, ThresholdsMode } from '@grafana/schema';

import { REACHABILITY_DESCRIPTION } from 'components/constants';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

import { divideSumByCountTransformation } from './divideSumByCountTransformation';

function getQueryRunner(metrics: DataSourceRef, minStep: string) {
  const queries = [
    {
      expr: 'sum(rate(probe_all_success_sum{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval]))',
      hide: false,
      instant: false,
      legendFormat: 'sum',
      interval: minStep,
      range: true,
      refId: 'A',
    },
    {
      exemplar: true,
      expr: 'sum(rate(probe_all_success_count{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval]))',
      hide: false,
      instant: false,
      interval: minStep,
      legendFormat: 'count',
      range: true,
      refId: 'B',
    },
  ];
  const runner = new SceneQueryRunner({
    datasource: metrics,
    queries,
  });

  return {
    runner: divideSumByCountTransformation(runner),
  };
}

export function getReachabilityStat(metrics: DataSourceRef, minStep: string) {
  const { runner } = getQueryRunner(metrics, minStep);
  return new ExplorablePanel({
    pluginId: 'stat',
    title: 'Reachability',
    description: REACHABILITY_DESCRIPTION,
    $data: runner,
    fieldConfig: {
      defaults: {
        mappings: [
          {
            options: {
              match: SpecialValueMatch.Null,
              result: {
                text: 'N/A',
              },
            },
            type: MappingType.SpecialValue,
          },
        ],
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
        decimals: 2,
        max: 1,
        min: 0,
        unit: 'percentunit',
      },
      overrides: [],
    },
  });
}
