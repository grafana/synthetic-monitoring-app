import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { ErrorLogs } from 'scenes/Common/ErrorLogsPanel';
import { getMinStepFromFrequency } from 'scenes/utils';

import { ReachabilityStat } from '../Common/ReachabilityStatViz';
import { UptimeStat } from '../Common/UptimeStatViz';
import { AvgLatency } from './stats/AvgLatencyViz';
import { Frequency } from './stats/FrequencyViz';
import { SSLExpiry } from './stats/SSLExpiryViz';
import { ErrorRateMap } from './ErrorRateMap';
import { ErrorRate } from './ErrorRateViz';
import { ResponseLatency } from './ResponseLatency';
import { ResponseLatencyByProbe } from './ResponseLatencyByProbe';

export const HttpDashboard = ({ check }: { check: Check }) => {
  const minStep = getMinStepFromFrequency(check.frequency);
  const styles = useStyles2(getStyles);

  return (
    <DashboardContainer check={check} checkType={CheckType.HTTP}>
      <div className={styles.vizLayout}>
        <div className={styles.errorRateMap}>
          <ErrorRateMap minStep={minStep} />
        </div>

        <div className={styles.nestedGrid}>
          <div className={styles.statsRow}>
            <UptimeStat check={check} />
            <ReachabilityStat check={check} />
            <AvgLatency />
            <SSLExpiry />
            <Frequency />
          </div>

          <ErrorRate minStep={minStep} />
        </div>

        <div className={styles.latencyRow}>
          <div className={styles.latencyPanel}>
            <ResponseLatency />
          </div>
          <div className={styles.latencyPanel}>
            <ResponseLatencyByProbe />
          </div>
        </div>

        <div className={styles.errorLogs}>
          <ErrorLogs startingUnsuccessfulOnly={true} />
        </div>
      </div>
    </DashboardContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  vizLayout: css({
    display: 'grid',
    gridTemplateColumns: '500px 1fr',
    gridTemplateRows: 'auto auto auto',
    columnGap: '8px',
    rowGap: '8px',
    height: '100%',
  }),
  errorRateMap: css({
    width: '500px',
    height: '500px',
  }),
  nestedGrid: css({
    display: 'grid',
    gridTemplateRows: '90px 1fr',
    height: '500px',
    rowGap: '8px',
  }),
  statsRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    height: '90px',
    gap: '8px',
  }),
  latencyRow: css({
    gridColumn: 'span 2',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridAutoRows: '300px',
    gap: '8px',
  }),
  latencyPanel: css({
    height: '300px',
  }),
  errorLogs: css({
    gridColumn: 'span 2',
    height: '500px',
  }),
});
