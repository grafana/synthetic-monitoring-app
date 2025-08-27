import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Grid, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { ErrorLogs } from 'scenes/Common/ErrorLogsPanel';
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
      <NodeGraph />
      <Grid columns={2} gap={1}>
        <RouteHash />
        <CommonHosts />
      </Grid>
      <Grid columns={3} gap={1}>
        <PacketLoss />
        <TraceTime />
        <AvgHops />
      </Grid>
      <div className={styles.errorLogs}>
        <ErrorLogs />
      </div>
    </DashboardContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  errorLogs: css({
    gridColumn: 'span 2',
    height: '500px',
  }),
});
