import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { AvgLatency } from 'scenes/Common/AvgLatencyViz';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { Frequency } from 'scenes/Common/FrequencyViz';
import { ReachabilityStat } from 'scenes/Common/ReachabilityStatViz';
import { UptimeStat } from 'scenes/Common/UptimeStatViz';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { AvgHops } from 'scenes/Traceroute/AvgHopsViz';
import { CommonHosts } from 'scenes/Traceroute/CommonHostsViz';
import { NodeGraph } from 'scenes/Traceroute/NodeGraphViz';
import { PacketLoss } from 'scenes/Traceroute/PacketLossViz';
import { RouteHash } from 'scenes/Traceroute/RouteHashViz';
import { TraceTime } from 'scenes/Traceroute/TraceTimeViz';

export const TracerouteDashboard = ({ check }: { check: Check }) => {
  const styles = useStyles2(getStyles);

  return (
    <DashboardContainer check={check} checkType={CheckType.Traceroute}>
      <Stack height={`90px`}>
        <UptimeStat check={check} />
        <ReachabilityStat check={check} />
        <AvgLatency />
        <AvgHops />
        <Frequency />
      </Stack>
      <NodeGraph />
      <TimepointExplorer check={check} />
      <div className={styles.grid}>
        <RouteHash />
        <CommonHosts />
      </div>
      <div className={styles.grid}>
        <PacketLoss />
        <TraceTime />
      </div>
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
});
