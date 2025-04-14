import React from 'react';
import { DataFrame } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { LogsDedupStrategy, LogsSortOrder } from '@grafana/schema';
import { parseCheckLogs } from 'features/parseCheckLogs/parseCheckLogs';
import { parseLokiLogs } from 'features/parseLogs/parseLokiLogs';

import { CheckLabel, CheckLabelType } from 'features/parseCheckLogs/checkLogs.types';
import { LokiSeries } from 'features/parseLogs/parseLogs.types';
import { useLogsDS } from 'hooks/useLogsDS';

import { useVizPanelMenu } from './useVizPanelMenu';

const viz = VizConfigBuilders.logs()
  .setOption('showTime', true)
  .setOption('showLabels', true)
  .setOption('showCommonLabels', false)
  .setOption('wrapLogMessage', true)
  .setOption('prettifyLogMessage', false)
  .setOption('enableLogDetails', true)
  .setOption('dedupStrategy', LogsDedupStrategy.none)
  .setOption('sortOrder', LogsSortOrder.Descending)
  .build();

export const ErrorLogs = () => {
  const logsDS = useLogsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: '{probe=~"$probe", instance="$instance", job="$job"} | logfmt',
        refId: 'Execution_Logs',
      },
    ],
    datasource: logsDS,
  });

  const data = dataProvider.useState();
  const [currentTimeRange] = useTimeRange();

  const menu = useVizPanelMenu({
    data,
    viz,
    currentTimeRange,
    variables: ['job', 'probe', 'instance'],
  });

  if (data?.data) {
    const seriesArray = data.data.series as DataFrame[];
    const series = seriesArray[0] as LokiSeries<CheckLabel, CheckLabelType>;
    console.log(series);

    if (series) {
      const parsedLogs = parseLokiLogs(series);
      console.log(parsedLogs);
      const checkLogs = parseCheckLogs(parsedLogs);
      console.log(checkLogs);
    }
  }

  return (
    <VizPanel
      title="Logs for failed checks: $probe ⮕ $job / $instance"
      viz={viz}
      dataProvider={dataProvider}
      menu={menu}
    />
  );
};
