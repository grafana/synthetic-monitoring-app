import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LogsDedupStrategy, LogsSortOrder } from '@grafana/schema';

import { useLogsDS } from 'hooks/useLogsDS';

export const ErrorLogs = () => {
  const logsDS = useLogsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: '{probe=~"$probe", instance="$instance", job="$job", probe_success="0"}',
        refId: 'A',
      },
    ],
    datasource: logsDS,
  });

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

  return <VizPanel title="Logs for failed checks: $probe ⮕ $job / $instance" viz={viz} dataProvider={dataProvider} />;
};
