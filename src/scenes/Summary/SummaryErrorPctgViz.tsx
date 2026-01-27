import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, useVariables, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

import { getCheckTypeTitle } from './SummaryDashboard.utils';

export const SummaryErrorPctgViz = () => {
  const metricsDS = useMetricsDS();
  const [currentTimeRange] = useTimeRange();
  const variables = useVariables();
  const checkTypeVar = variables.find((v) => v.state.name === 'check_type');

  const query = `1 - sum(
      rate(probe_all_success_sum{probe=~"$probe"}[$__rate_interval])
      * 
      on (
        instance, job, probe, config_version
      ) 
      group_left
      max(
        sm_check_info{check_name=~"$check_type", region=~"$region", $Filters}
      ) 
      by (instance, job, probe, config_version)
    ) 
    by (job, instance) 
    / 
    sum(
      rate(
        probe_all_success_count{probe=~"$probe"}[$__rate_interval])
        * 
        on (
          instance, job, probe, config_version
        ) 
        group_left 
        max(
          sm_check_info{check_name=~"$check_type", region=~"$region", $Filters}
        ) 
        by (
          instance, job, probe, config_version
        )
      ) 
    by (job, instance)`;

  const dataProvider = useQueryRunner({
    queries: [
      {
        exemplar: true,
        expr: query,
        hide: false,
        interval: '1m',
        legendFormat: '{{job}}/{{ instance }}',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('percentunit')
    .setMin(0)
    .setMax(1)
    .setCustomFieldConfig('spanNulls', true)
    .setOption('tooltip', { mode: TooltipDisplayMode.Single, sort: SortOrder.None })
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'bottom',
      calcs: [],
    })
    .build();

  const data = dataProvider.useState();

  const menu = useVizPanelMenu({
    data,
    viz,
    currentTimeRange,
    variables: ['probe', 'check_type', 'region', 'Filters'],
  });

  const title = getCheckTypeTitle(checkTypeVar, ' check error percentage');

  return <VizPanel menu={menu} title={title} viz={viz} dataProvider={dataProvider} />;
};

