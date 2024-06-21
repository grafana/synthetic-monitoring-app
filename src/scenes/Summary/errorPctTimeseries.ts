import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getErrorPercentageQuery() {
  return `1 - sum(
      rate(probe_all_success_sum{probe=~"$probe"}[$__rate_interval])
      * 
      on (
        instance, job, probe, config_version
      ) 
      group_left
      max(
        sm_check_info{check_name=~"$check_type", region=~"$region", $Filters}
      ) 
      by (instance, job, probe, config_version)
    ) 
    by (job, instance) 
    / 
    sum(
      rate(
        probe_all_success_count{probe=~"$probe"}[$__rate_interval])
        * 
        on (
          instance, job, probe, config_version
        ) 
        group_left 
        max(
          sm_check_info{check_name=~"$check_type", region=~"$region", $Filters}
        ) 
        by (
          instance, job, probe, config_version
        )
      ) 
    by (job, instance)`;
}

function getErrorPercentageQueryRunner(metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: getErrorPercentageQuery(),
        hide: false,
        interval: '1m',
        legendFormat: '{{job}}/{{ instance }}',
        refId: 'A',
      },
    ],
  });
  return queryRunner;
}

export function getErrorPctgTimeseriesPanel(metrics: DataSourceRef) {
  const errorPercentagePanel = new ExplorablePanel({
    pluginId: 'timeseries',
    title: `$check_type check error percentage`,
    fieldConfig: {
      defaults: {
        min: 0,
        max: 1,
        unit: 'percentunit',
        custom: {
          spanNulls: true,
        },
      },
      overrides: [],
    },
    options: {
      tooltip: {
        mode: 'single',
        sort: 'none',
      },
      legend: {
        showLegend: true,
        displayMode: 'table',
        placement: 'bottom',
        calcs: [],
      },
    },
    $data: getErrorPercentageQueryRunner(metrics),
  });
  return errorPercentagePanel;
}
