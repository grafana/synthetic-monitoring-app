import React from 'react';
import { DataTransformerID } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { TableCellBackgroundDisplayMode, TableCellDisplayMode, ThresholdsMode } from '@grafana/schema';

import { useLogsDS } from 'hooks/useLogsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const HopSummaryTable = () => {
  const logsDS = useLogsDS();

  const queries = [
    {
      expr: 'avg by (TTL, Hosts) (avg_over_time({check_name="traceroute", job="$job", instance="$instance", probe=~"$probe"} | logfmt | TTL != `` | unwrap LossPercent [$__range]))',
      instant: true,
      refId: 'Loss',
    },
    {
      expr: 'avg by (TTL, Hosts) (avg_over_time({check_name="traceroute", job="$job", instance="$instance", probe=~"$probe"} | logfmt | TTL != `` | unwrap duration(ElapsedTime) [$__range]))',
      instant: true,
      refId: 'RTT',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    datasource: logsDS,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.joinByField,
        options: {
          byField: 'TTL',
          mode: 'outer',
        },
      },
      {
        id: DataTransformerID.organize,
        options: {
          excludeByName: {
            'Hosts 2': true,
            'Time 1': true,
            'Time 2': true,
          },
          indexByName: {},
          renameByName: {
            'Hosts 1': 'Hosts seen at this hop',
            TTL: 'Hop (TTL)',
            'Value #Loss': 'Avg loss %',
            'Value #RTT': 'Avg RTT',
          },
        },
      },
      {
        id: DataTransformerID.convertFieldType,
        options: {
          conversions: [
            {
              destinationType: 'number',
              targetField: 'Hop (TTL)',
            },
          ],
        },
      },
      {
        id: DataTransformerID.sortBy,
        options: {
          sort: [
            {
              desc: false,
              field: 'Hop (TTL)',
            },
          ],
        },
      },
    ],
  });

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      dataProvider={dataTransformer}
      description={`Each hop with its hosts, average loss and average RTT, aggregated across every execution in the selected time range. Read top to bottom = probe to destination. The LAST row (destination) is the one that matters for real loss — high loss at intermediate hops is usually ICMP deprioritization, not packet loss. Multiple IPs at one hop = ECMP/load-balanced paths.`}
      menu={menu}
      title={`Per-hop summary`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.table()
  .setCustomFieldConfig(`cellOptions`, {
    type: TableCellDisplayMode.Auto,
  })
  .setCustomFieldConfig(`filterable`, false)
  .setOverrides((b) => {
    return b
      .matchFieldsWithName(`Avg loss %`)
      .overrideUnit('percent')
      .overrideDecimals(1)
      .overrideCustomFieldConfig(`cellOptions`, {
        mode: TableCellBackgroundDisplayMode.Gradient,
        type: TableCellDisplayMode.ColorBackground,
      })
      .overrideThresholds({
        mode: ThresholdsMode.Absolute,
        steps: [
          {
            color: 'green',
            value: 0,
          },
          {
            color: 'yellow',
            value: 5,
          },
          {
            color: 'red',
            value: 30,
          },
        ],
      })
      .build();
  })
  .setOverrides((b) => {
    return b.matchFieldsWithName(`Avg RTT`).overrideUnit('s').overrideDecimals(4).build();
  })
  .build();
