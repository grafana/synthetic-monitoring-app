import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { AvgLatency } from 'scenes/Common/AvgLatencyViz';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { ErrorRateMap } from 'scenes/Common/ErrorRateMapViz';
import { ErrorRate } from 'scenes/Common/ErrorRateViz';
import { Frequency } from 'scenes/Common/FrequencyViz';
import { ReachabilityStat } from 'scenes/Common/ReachabilityStatViz';
import { ResponseLatencyByProbe } from 'scenes/Common/ResponseLatencyByProbe';
import { UptimeStat } from 'scenes/Common/UptimeStatViz';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { getMinStepFromFrequency } from 'scenes/utils';

import { AnswerRecords } from './AnswerRecordsViz';
import { ResourceRecords } from './ResourceRecordsViz';

export const DNSDashboard = ({ check }: { check: Check }) => {
  const minStep = getMinStepFromFrequency(check.frequency);
  const styles = useStyles2(getStyles);

  return (
    <DashboardContainer check={check} checkType={CheckType.DNS}>
      <Stack height={`90px`}>
        <UptimeStat check={check} />
        <ReachabilityStat check={check} />
        <AvgLatency />
        <AnswerRecords />
        <Frequency />
      </Stack>
      <TimepointExplorer check={check} />

      <div className={styles.errorRateRow}>
        <ErrorRateMap minStep={minStep} />
        <ErrorRate minStep={minStep} />
      </div>

      <div className={styles.latencyRow}>
        <ResponseLatencyByProbe />
        <ResourceRecords />
      </div>
    </DashboardContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  errorRateRow: css`
    display: grid;
    grid-template-columns: 500px 1fr;
    gap: ${theme.spacing(1)};
    height: 500px;
  `,
  latencyRow: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    height: 300px;
  `,
});
