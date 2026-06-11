import React from 'react';
import { AnnotationQuery, GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { ErrorLogs } from 'scenes/Common/ErrorLogsPanel';
import { Frequency } from 'scenes/Common/FrequencyViz';
import { ReachabilityStat } from 'scenes/Common/ReachabilityStatViz';
import { UptimeStat } from 'scenes/Common/UptimeStatViz';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { AvgHops } from 'scenes/Traceroute/AvgHopsViz';
import { CommonHosts } from 'scenes/Traceroute/CommonHostsViz';
import { HopLossOverTime } from 'scenes/Traceroute/HopLossOverTimeViz';
import { HopSummaryTable } from 'scenes/Traceroute/HopSummaryTableViz';
import { NodeGraph } from 'scenes/Traceroute/NodeGraphViz';
import { PacketLoss } from 'scenes/Traceroute/PacketLossViz';
import { PathChangesOverTime } from 'scenes/Traceroute/PathChangesOverTimeViz';
import { PathChangesStat } from 'scenes/Traceroute/PathChangesStatViz';
import { TraceCompletionTime } from 'scenes/Traceroute/TraceCompletionTimeViz';

export const TracerouteDashboard = ({ check }: { check: Check }) => {
  const styles = useStyles2(getStyles);
  const metricsDS = useMetricsDS();

  // The >4 threshold filters out ECMP noise: load-balanced networks flap the route
  // hash between equally-valid paths constantly, so single changes are not events.
  const pathChangeAnnotation: AnnotationQuery = {
    datasource: metricsDS,
    expr: `changes(probe_traceroute_route_hash{job="$job", instance="$instance", probe=~"$probe"}[15m]) > 4`,
    hide: false,
    refId: 'pathChangeAnnotation',
    enable: true,
    iconColor: 'orange',
    name: 'Show path changes',
    titleFormat: 'Path changed ({{probe}})',
    textFormat: 'The route fingerprint changed repeatedly — traffic is taking a different path to the target.',
  };

  return (
    <DashboardContainer check={check} checkType={CheckType.Traceroute} extraAnnotations={[pathChangeAnnotation]}>
      <Stack height={`90px`}>
        <UptimeStat check={check} />
        <ReachabilityStat check={check} />
        <TraceCompletionTime />
        <AvgHops />
        <PathChangesStat />
        <Frequency />
      </Stack>
      <NodeGraph />
      <TimepointExplorer check={check} />
      <div className={styles.grid}>
        <PathChangesOverTime />
        <CommonHosts />
      </div>
      <div className={styles.grid}>
        <PacketLoss />
        <HopLossOverTime />
      </div>
      <div className={styles.hopSummary}>
        <HopSummaryTable />
      </div>
      <ErrorLogs startingUnsuccessfulOnly />
    </DashboardContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    height: 300px;
  `,
  hopSummary: css`
    height: 400px;
  `,
});
