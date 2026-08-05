import React from 'react';
import { DataTransformerID } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LineInterpolation, TableCellDisplayMode } from '@grafana/schema';
import { Box } from '@grafana/ui';

import { QueryType } from 'datasource/types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

enum MetricRefId {
  Fcp = 'FCP',
  Lcp = 'LCP',
  Ttfb = 'TTFB',
  Cls = 'CLS',
  Inp = 'INP',
}

export const MetricsByURL = () => {
  const smDS = useSMDS();
  // only so "Explore" opens against the datasource that holds the data
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: MetricRefId.Fcp,
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_fcp',
        by: ['url'],
      },
      {
        refId: MetricRefId.Lcp,
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_lcp',
        by: ['url'],
      },
      {
        refId: MetricRefId.Ttfb,
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_ttfb',
        by: ['url'],
      },
      {
        refId: MetricRefId.Cls,
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_cls',
        by: ['url'],
      },
      {
        refId: MetricRefId.Inp,
        queryType: QueryType.AvgQuantileWebVital,
        metric: 'probe_browser_web_vital_inp',
        by: ['url'],
      },
    ],
    datasource: smDS.instanceSettings,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.timeSeriesTable,
        options: {
          [MetricRefId.Fcp]: {
            stat: 'mean',
          },
          [MetricRefId.Lcp]: {
            stat: 'mean',
          },
          [MetricRefId.Ttfb]: {
            stat: 'mean',
          },
          [MetricRefId.Cls]: {
            stat: 'mean',
          },
          [MetricRefId.Inp]: {
            stat: 'mean',
          },
        },
      },
      {
        id: DataTransformerID.joinByField,
        options: {
          byField: 'url',
          mode: 'outer',
        },
      },
      {
        id: DataTransformerID.organize,
        options: {
          excludeByName: {
            instance: true,
            job: true,
          },
          renameByName: {
            url: 'Page URL',
            [`Trend #${MetricRefId.Fcp}`]: 'FCP',
            [`Trend #${MetricRefId.Lcp}`]: 'LCP',
            [`Trend #${MetricRefId.Ttfb}`]: 'TTFB',
            [`Trend #${MetricRefId.Cls}`]: 'CLS',
            [`Trend #${MetricRefId.Inp}`]: 'INP',
          },
        },
      },
    ],
  });

  const viz = VizConfigBuilders.table()
    .setCustomFieldConfig(`cellOptions`, {
      type: TableCellDisplayMode.Sparkline,
      hideValue: false,
      lineInterpolation: LineInterpolation.Smooth,
      spanNulls: true,
      insertNulls: true,
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName(`url`)
        .overrideCustomFieldConfig(`cellOptions`, {
          type: TableCellDisplayMode.Auto,
        })
        .build();
    })
    .setOverrides((b) => {
      return b.matchFieldsWithName(`Trend #${MetricRefId.Cls}`).overrideUnit(``).build();
    })
    .setNoValue(`-`)
    .setUnit('ms')
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
    exploreDatasourceUid: metricsDS?.uid,
  });

  return (
    <Box height={`300px`}>
      <VizPanel menu={menu} viz={viz} dataProvider={dataTransformer} title="Metrics by URL" />
    </Box>
  );
};
