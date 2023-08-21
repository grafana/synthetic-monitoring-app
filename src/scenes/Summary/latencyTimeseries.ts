import { ConstantVariable, SceneQueryRunner, SceneVariableSet } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { ExplorablePanel } from 'scenes/ExplorablePanel';
import { CheckType } from 'types';

function getLatencyQueryRunner(checkType: CheckType, metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `sum(rate(probe_all_duration_seconds_sum[5m]) * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name="${checkType}", region=~"$region"}) by (instance, job, probe, config_version))  by (job, instance) / sum(rate(probe_all_duration_seconds_count[5m]) * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name="${checkType}", region=~"$region"}) by (instance, job, probe, config_version)) by (job, instance)`,
        hide: false,
        interval: '',
        legendFormat: '{{job}}/{{ instance }}',
        refId: 'A',
      },
    ],
    // maxDataPoints: 100,
  });
  return queryRunner;
}

export function getLatencyTimeseriesPanel(checkType: CheckType, metrics: DataSourceRef) {
  const latencyPanel = new ExplorablePanel({
    pluginId: 'timeseries',
    title: `${checkType} latency`,
    $data: getLatencyQueryRunner(checkType, metrics),
    $variables: new SceneVariableSet({
      variables: [new ConstantVariable({ value: checkType, name: 'check_type' })],
    }),
  });
  return latencyPanel;
}
