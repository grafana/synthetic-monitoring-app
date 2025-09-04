import React, { useState } from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { LogsDedupStrategy, LogsSortOrder } from '@grafana/schema';
import { Box, InlineSwitch } from '@grafana/ui';

import { FeatureName } from 'types';
import { useLogsDS } from 'hooks/useLogsDS';
import { FeatureFlag } from 'components/FeatureFlag';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

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

export const ErrorLogs = ({ startingUnsuccessfulOnly = false }: { startingUnsuccessfulOnly?: boolean }) => {
  const logsDS = useLogsDS();
  const [unsuccessfulOnly, setUnsuccessfulOnly] = useState(startingUnsuccessfulOnly);
  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: `{probe=~"$probe", instance="$instance", job="$job", probe_success=~"${
          unsuccessfulOnly ? '0' : '.*'
        }"} | logfmt`,
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

  return (
    <FeatureFlag name={FeatureName.TimepointExplorer}>
      {({ isEnabled }) =>
        !isEnabled ? (
          <Box height={`850px`}>
            <VizPanel
              title="Logs for checks: $probe ⮕ $job / $instance"
              viz={viz}
              dataProvider={dataProvider}
              menu={menu}
              headerActions={
                <InlineSwitch
                  label="Unsuccessful runs only"
                  transparent
                  showLabel
                  defaultChecked={unsuccessfulOnly}
                  onChange={() => setUnsuccessfulOnly(!unsuccessfulOnly)}
                />
              }
            />
          </Box>
        ) : null
      }
    </FeatureFlag>
  );
};
