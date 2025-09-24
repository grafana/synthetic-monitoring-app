import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const SSLExpiry = () => {
  const metricsDS = useMetricsDS();

  const queries = [
    {
      expr: `min(probe_ssl_earliest_cert_expiry{probe=~"$probe",instance="$instance", job="$job"}) - time()`,
      instant: true,
      legendFormat: 'sum',
      refId: 'B',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.stat()
    .setOption('graphMode', BigValueGraphMode.None)
    .setUnit('s')
    .setDecimals(2)
    .setMin(0)
    .setMax(1)
    .setNoValue('N/A')
    .setThresholds({
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

  return (
    <VizPanel
      menu={menu}
      title="SSL Expiry"
      viz={viz}
      dataProvider={dataProvider}
      description="The time remaining until SSL chain expiry"
    />
  );
};
