import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getBrowserDataReceivedQuery } from 'queries/browserDataReceived';
import { getBrowserDataSentQuery } from 'queries/browserDataSent';
import { getCountDistinctTargetsQuery } from 'queries/countDistinctTargets';
import { getSumDurationByProbeQuery } from 'queries/sumDurationByProbe';

import { Check, CheckType } from 'types';
import { getCheckType } from 'utils';
import { MetricsByURL } from 'scenes/BrowserDashboard/MetricsByURL';
import { WebVitalsAverageRow } from 'scenes/BrowserDashboard/WebVitalsAverageRow';
import { WebVitalsOverTimeRow } from 'scenes/BrowserDashboard/WebVitalsOverTimeRow';
import { AssertionsTable } from 'scenes/Common/AssertionsTable';
import { AvgLatency } from 'scenes/Common/AvgLatencyViz';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { DataReceived } from 'scenes/Common/DataReceived';
import { DataSent } from 'scenes/Common/DataSent';
import { DistinctTargets } from 'scenes/Common/DistinctTargets';
import { DurationByProbe } from 'scenes/Common/DurationByProbe';
import { ErrorLogs } from 'scenes/Common/ErrorLogsPanel';
import { Frequency } from 'scenes/Common/FrequencyViz';
import { ReachabilityStat } from 'scenes/Common/ReachabilityStatViz';
import { UptimeStat } from 'scenes/Common/UptimeStatViz';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';

export const BrowserDashboard = ({ check }: { check: Check }) => {
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);

  return (
    <DashboardContainer check={check} checkType={checkType}>
      <Stack height={`90px`}>
        <UptimeStat check={check} />
        <ReachabilityStat check={check} />
        <AvgLatency />
        <Frequency />
      </Stack>
      <TimepointExplorer check={check} />
      <WebVitalsAverageRow />
      <WebVitalsOverTimeRow />
      <MetricsByURL />

      <Stack height={`200px`}>
        <Box width={`200px`}>
          <DistinctTargets query={getCountDistinctTargetsQuery({ metric: 'probe_browser_web_vital_fcp' })} />
        </Box>
        <DurationByProbe query={getSumDurationByProbeQuery({ metric: 'probe_browser_http_req_duration' })} unit="ms" />
      </Stack>

      <div className={styles.dataRow}>
        <DataSent query={getBrowserDataSentQuery()} />
        <DataReceived query={getBrowserDataReceivedQuery()} />
      </div>
      <AssertionsTable checkType={CheckType.Scripted} check={check} />
      <ErrorLogs startingUnsuccessfulOnly={false} />
    </DashboardContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  dataRow: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    height: 200px;
  `,
});
