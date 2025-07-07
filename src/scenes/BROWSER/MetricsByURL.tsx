import React from 'react';
import { DataTransformerID, FieldType } from '@grafana/data';
import { FieldConfigOverridesBuilder, VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LineInterpolation, TableCellDisplayMode, TableFieldOptions } from '@grafana/schema';
import { Box } from '@grafana/ui';
import { getAvgQuantileWebVital } from 'queries/avgQuantileWebVital';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

enum MetricRefId {
  FCP = 'FCP',
  LCP = 'LCP',
  TTFB = 'TTFB',
  CLS = 'CLS',
  FID = 'FID',
  INP = 'INP',
}

export const MetricsByURL = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: MetricRefId.FCP,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_fcp', by: ['url'] }),
      },
      {
        refId: MetricRefId.LCP,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_lcp', by: ['url'] }),
      },
      {
        refId: MetricRefId.TTFB,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_ttfb', by: ['url'] }),
      },
      {
        refId: MetricRefId.CLS,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_cls', by: ['url'] }),
      },
      {
        refId: MetricRefId.FID,
        ...getAvgQuantileWebVital({ metric: 'probe_browser_web_vital_fid', by: ['url'] }),
      },
      {
        refId: MetricRefId.INP,
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
          [MetricRefId.FCP]: {
            stat: 'mean',
          },
          [MetricRefId.LCP]: {
            stat: 'mean',
          },
          [MetricRefId.TTFB]: {
            stat: 'mean',
          },
          [MetricRefId.CLS]: {
            stat: 'mean',
          },
          [MetricRefId.FID]: {
            stat: 'mean',
          },
          [MetricRefId.INP]: {
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
            [`Trend #${MetricRefId.FCP}`]: 'FCP',
            [`Trend #${MetricRefId.LCP}`]: 'LCP',
            [`Trend #${MetricRefId.TTFB}`]: 'TTFB',
            [`Trend #${MetricRefId.CLS}`]: 'CLS',
            [`Trend #${MetricRefId.FID}`]: 'FID',
            [`Trend #${MetricRefId.INP}`]: 'INP',
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
        .matchFieldsWithName(`Trend #${MetricRefId.FID}`)
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
