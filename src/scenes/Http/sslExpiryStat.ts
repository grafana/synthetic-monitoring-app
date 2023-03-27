import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variableSet,
    queries: [
      {
        expr: 'min(probe_ssl_earliest_cert_expiry{probe=~"$probe",instance="$instance", job="$job"}) - time()',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'B',
      },
    ],
  });
}

export function getSSLExpiryStat(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  const queryRunner = getQueryRunner(variableSet, metrics);
  return new VizPanel({
    pluginId: 'stat',
    title: 'SSL Expiry',
    description: 'The average time to receive an answer across all the checks during the whole time period.',
    $data: queryRunner,
    placement: {
      height: 90,
    },
    fieldConfig: {
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
              color: '#d44a3a',
              value: 0,
            },
            {
              color: 'rgba(237, 129, 40, 0.89)',
              value: 604800,
            },
            {
              color: '#299c46',
              value: 2419200,
            },
          ],
        },
        unit: 's',
      },
      overrides: [],
    },
  });
}
