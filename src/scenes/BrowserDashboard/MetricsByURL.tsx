import React from 'react';
import { DataTransformerID } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LineInterpolation, TableCellDisplayMode } from '@grafana/schema';
import { Box } from '@grafana/ui';
import { getAvgQuantileWebVital } from 'queries/avgQuantileWebVital';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

enum MetricRefId {
  Fcp = 'FCP',
  Lcp = 'LCP',
  Ttfb = 'TTFB',
  Cls = 'CLS',
  Fid = 'FID',
  Inp = 'INP',
}

export const MetricsByURL = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: MetricRefId.Fcp,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_fcp', by: ['url'] }),
      },
      {
        refId: MetricRefId.Lcp,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_lcp', by: ['url'] }),
      },
      {
        refId: MetricRefId.Ttfb,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_ttfb', by: ['url'] }),
      },
      {
        refId: MetricRefId.Cls,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_cls', by: ['url'] }),
      },
      {
        refId: MetricRefId.Fid,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_fid', by: ['url'] }),
      },
      {
        refId: MetricRefId.Inp,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_inp', by: ['url'] }),
      },
    ],
    datasource: metricsDS,
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
          [MetricRefId.Fid]: {
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
            [`Trend #${MetricRefId.Fid}`]: 'FID',
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
        .matchFieldsWithName(`Trend #${MetricRefId.Fid}`)
        .overrideCustomFieldConfig(`displayMode`, TableCellDisplayMode.Custom)
        .build();
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
  });

  return (
    <Box height={`300px`}>
      <VizPanel menu={menu} viz={viz} dataProvider={dataTransformer} title="Metrics by URL" />
    </Box>
  );
};
