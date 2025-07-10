import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { GraphDrawStyle } from '@grafana/schema';
import { Box, Grid, TooltipDisplayMode } from '@grafana/ui';
import { getAvgQuantileWebVital } from 'queries/avgQuantileWebVital';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const WebVitalsOverTimeRow = () => {
  return (
    <Grid columns={3} gap={1}>
      <PageLoad />
      <CLS />
      <InputResponseTime />
    </Grid>
  );
};

const PageLoad = () => {
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_fcp' }),
        legendFormat: 'FCP',
      },
      {
        refId: 'B',
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_lcp' }),
        legendFormat: 'LCP',
      },
      {
        refId: 'C',
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_ttfb' }),
        legendFormat: 'TTFB',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('fillOpacity', 10)
    .setCustomFieldConfig('spanNulls', true)
    .setCustomFieldConfig('pointSize', 5)
    .setUnit('ms')
    .build();
  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box height={`200px`}>
      <VizPanel menu={menu} title={`Page Load (TTFB, FCP, LCP) - p75`} viz={viz} dataProvider={dataProvider} />
    </Box>
  );
};

const CLS = () => {
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_cls' }),
        legendFormat: 'CLS',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('fillOpacity', 10)
    .setCustomFieldConfig('spanNulls', true)
    .setCustomFieldConfig('pointSize', 5)
    .setUnit('ms')
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box height={`200px`}>
      <VizPanel
        menu={menu}
        title={`Cumulative Layout Shift (CLS) - p75
`}
        viz={viz}
        dataProvider={dataProvider}
      />
    </Box>
  );
};

const InputResponseTime = () => {
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_fid' }),
        legendFormat: 'FID',
      },
      {
        refId: 'B',
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_inp' }),
        legendFormat: 'INP',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('fillOpacity', 10)
    .setCustomFieldConfig('spanNulls', true)
    .setCustomFieldConfig('pointSize', 5)
    .setUnit('ms')
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box height={`200px`}>
      <VizPanel menu={menu} title={`Input Response Time (FID, INP) - p75`} viz={viz} dataProvider={dataProvider} />
    </Box>
  );
};
