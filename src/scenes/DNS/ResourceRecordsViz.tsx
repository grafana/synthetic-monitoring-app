import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import {
  GraphDrawStyle,
  LegendDisplayMode,
  LineInterpolation,
  SortOrder,
  TooltipDisplayMode,
  VisibilityMode,
} from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const ResourceRecords = () => {
  const metricsDS = useMetricsDS();

  const queries = [
    {
      expr: 'avg(probe_dns_answer_rrs{probe=~"$probe", instance="$instance", job="$job"})',
      instant: false,
      interval: '',
      intervalFactor: 1,
      legendFormat: 'Answer Records',
      refId: 'A',
    },
    {
      expr: 'avg(probe_dns_authority_rrs{probe=~"$probe", instance="$instance", job="$job"})',
      instant: false,
      interval: '',
      intervalFactor: 1,
      legendFormat: 'Authority Records',
      refId: 'B',
    },
    {
      expr: 'avg(probe_dns_additional_rrs{probe=~"$probe", instance="$instance", job="$job"})',
      instant: false,
      interval: '',
      intervalFactor: 1,
      legendFormat: 'Additional Records',
      refId: 'C',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineInterpolation', LineInterpolation.Linear)
    .setCustomFieldConfig('lineWidth', 2)
    .setCustomFieldConfig('fillOpacity', 0)
    .setCustomFieldConfig('showPoints', VisibilityMode.Never)
    .setCustomFieldConfig('pointSize', 5)
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi, sort: SortOrder.None })
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'right',
      calcs: ['mean', 'lastNotNull'],
    })
    .setUnit('none')
    .setDecimals(0)
    .build();

  const data = dataProvider.useState();
  const [currentTimeRange] = useTimeRange();

  const menu = useVizPanelMenu({
    data,
    viz,
    currentTimeRange,
    variables: ['job', 'probe', 'instance'],
  });

  return <VizPanel menu={menu} title="Resource records" viz={viz} dataProvider={dataProvider} />;
};
