import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { GraphDrawStyle } from '@grafana/schema';
import { Box, Grid, TooltipDisplayMode } from '@grafana/ui';

import { QueryType } from 'datasource/types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
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
  const smDS = useSMDS();
  // only so "Explore" opens against the datasource that holds the data
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_fcp',
        legendFormat: 'FCP',
      },
      {
        refId: 'B',
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_lcp',
        legendFormat: 'LCP',
      },
      {
        refId: 'C',
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_ttfb',
        legendFormat: 'TTFB',
      },
    ],
    datasource: smDS.instanceSettings,
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
    exploreDatasourceUid: metricsDS?.uid,
  });

  return (
    <Box height={`200px`}>
      <VizPanel menu={menu} title={`Page Load (TTFB, FCP, LCP) - p75`} viz={viz} dataProvider={dataProvider} />
    </Box>
  );
};

const CLS = () => {
  const smDS = useSMDS();
  // only so "Explore" opens against the datasource that holds the data
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_cls',
        legendFormat: 'CLS',
      },
    ],
    datasource: smDS.instanceSettings,
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
    exploreDatasourceUid: metricsDS?.uid,
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
  const smDS = useSMDS();
  // only so "Explore" opens against the datasource that holds the data
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_inp',
        legendFormat: 'INP',
      },
    ],
    datasource: smDS.instanceSettings,
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
    exploreDatasourceUid: metricsDS?.uid,
  });

  return (
    <Box height={`200px`}>
      <VizPanel menu={menu} title={`Input Response Time (INP) - p75`} viz={viz} dataProvider={dataProvider} />
    </Box>
  );
};
