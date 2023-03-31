import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef, MappingType, SpecialValueMatch, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: 'avg(probe_dns_answer_rrs{probe=~"$probe",instance="$instance", job="$job"})',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'B',
      },
    ],
  });
}

export function getAnswerRecordsStat(metrics: DataSourceRef) {
  const panel = new VizPanel({
    pluginId: 'stat',
    title: 'Answer Records',
    $data: getQueryRunner(metrics),
    placement: {
      height: 90,
    },
    fieldConfig: {
      defaults: {
        mappings: [
          {
            type: MappingType.SpecialValue,
            options: {
              match: SpecialValueMatch.Empty,
              result: {
                text: 'N/A',
              },
            },
          },
        ],
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'green',
              value: 0,
            },
          ],
        },
        unit: 'short',
      },
      overrides: [],
    },
    options: {
      reduceOptions: {
        values: false,
        calcs: ['mean'],
        fields: '',
      },
      orientation: 'horizontal',
      textMode: 'auto',
      colorMode: 'value',
      graphMode: 'none',
      justifyMode: 'auto',
      fieldOptions: {
        calcs: ['lastNotNull'],
      },
      text: {},
    },
  });
  return panel;
}
