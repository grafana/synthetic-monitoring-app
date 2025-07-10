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
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { DataReceived } from 'scenes/Common/DataReceived';
import { DataSent } from 'scenes/Common/DataSent';
import { DistinctTargets } from 'scenes/Common/DistinctTargets';
import { DurationByProbe } from 'scenes/Common/DurationByProbe';
import { ErrorLogs } from 'scenes/Common/ErrorLogsPanel';
import { ReachabilityStat } from 'scenes/HTTP/stats/ReachabilityStatViz';
import { UptimeStat } from 'scenes/HTTP/stats/UptimeStatViz';

export const BrowserDashboard = ({ check }: { check: Check }) => {
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);

  return (
    <DashboardContainer check={check} checkType={checkType}>
      <div className={styles.header}>
        <UptimeStat check={check} />
        <ReachabilityStat check={check} />
      </div>
      <WebVitalsAverageRow />
      <WebVitalsOverTimeRow />
      <MetricsByURL />
      <AssertionsTable checkType={CheckType.Scripted} check={check} />

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

      <Box height={`750px`}>
        <ErrorLogs />
      </Box>
    </DashboardContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  header: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    height: '150px',
  }),
  body: css({
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  }),
  distinctRow: css({
    display: 'flex',
    gap: '8px',
    height: '200px',
  }),
  dataRow: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    height: '200px',
  }),
});
