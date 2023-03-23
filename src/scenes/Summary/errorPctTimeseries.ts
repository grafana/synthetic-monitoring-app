import { ConstantVariable, SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { CheckType } from 'types';

function getErrorPercentageQuery(checkType: CheckType) {
  return `
    1 - (
      sum(
        rate(probe_all_success_sum[$__range]) 
        * on (instance, job, probe, config_version) 
        group_left(geohash) 
        max by (instance, job, probe, config_version, check_name, geohash)
        (sm_check_info{check_name="${checkType}", region=~"$region"})
      ) 
      /
      sum(
        rate(probe_all_success_count[$__range]) 
        * on (instance, job, probe, config_version) 
        group_left(geohash) 
        max by (instance, job, probe, config_version, check_name, geohash)
        (sm_check_info{check_name="${checkType}", region=~"$region"})
      )
    )`;
}

function getErrorPercentageQueryRunner(checkType: CheckType, metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: getErrorPercentageQuery(checkType),
        hide: false,
        interval: '1m',
        tor: 1,
        legendFormat: '% Errors',
        refId: 'A',
      },
    ],
    // maxDataPoints: 100,
  });
  return queryRunner;
}

export function getErrorPctgTimeseriesPanel(checkType: CheckType, metrics: DataSourceRef) {
  const errorPercentagePanel = new VizPanel({
    pluginId: 'timeseries',
    title: `${checkType} check error percentage`,
    fieldConfig: {
      defaults: {
        min: 0,
        max: 1,
      },
      overrides: [],
    },
    $data: getErrorPercentageQueryRunner(checkType, metrics),
    $variables: new SceneVariableSet({
      variables: [new ConstantVariable({ value: checkType, name: 'check_type' })],
    }),
  });
  return errorPercentagePanel;
}
