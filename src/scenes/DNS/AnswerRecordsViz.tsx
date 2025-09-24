import React from 'react';
import { SpecialValueMatch } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, BigValueTextMode, MappingType, ThresholdsMode, VizOrientation } from '@grafana/schema';
import { BigValueColorMode, BigValueJustifyMode } from '@grafana/ui';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const AnswerRecords = () => {
  const metricsDS = useMetricsDS();

  const queries = [
    {
      expr: 'avg(probe_dns_answer_rrs{probe=~"$probe",instance="$instance", job="$job"})',
      hide: false,
      instant: true,
      interval: '',
      legendFormat: '',
      refId: 'B',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.stat()
    .setOption('graphMode', BigValueGraphMode.None)
    .setUnit('short')
    .setNoValue('N/A')
    .setOption('orientation', VizOrientation.Horizontal)
    .setOption('textMode', BigValueTextMode.Auto)
    .setOption('colorMode', BigValueColorMode.Value)
    .setOption('justifyMode', BigValueJustifyMode.Auto)
    .setMappings([
      {
        type: MappingType.SpecialValue,
        options: {
          match: SpecialValueMatch.Empty,
          result: {
            text: 'N/A',
          },
        },
      },
    ])
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        {
          color: 'green',
          value: 0,
        },
      ],
    })
    .build();

  const data = dataProvider.useState();
  const [currentTimeRange] = useTimeRange();

  const menu = useVizPanelMenu({
    data,
    viz,
    currentTimeRange,
    variables: ['job', 'probe', 'instance'],
  });

  return <VizPanel menu={menu} title="Answer Records" viz={viz} dataProvider={dataProvider} />;
};
