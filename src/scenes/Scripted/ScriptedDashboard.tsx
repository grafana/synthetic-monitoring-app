import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getCountDistinctTargetsQuery } from 'queries/countDistinctTargets';
import { getScriptedDataReceivedQuery } from 'queries/scriptedDataReceived';
import { getScriptedDataSentQuery } from 'queries/scriptedDataSent';
import { getSumDurationByProbeQuery } from 'queries/sumDurationByProbe';

import { Check, CheckType } from 'types';
import { getCheckType } from 'utils';
import { AssertionsTable } from 'scenes/Common/AssertionsTable';
import { AvgLatency } from 'scenes/Common/AvgLatencyViz';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { DataReceived } from 'scenes/Common/DataReceived';
import { DataSent } from 'scenes/Common/DataSent';
import { DistinctTargets } from 'scenes/Common/DistinctTargets';
import { DurationByProbe } from 'scenes/Common/DurationByProbe';
import { ErrorRateMap } from 'scenes/Common/ErrorRateMapViz';
import { ErrorRate } from 'scenes/Common/ErrorRateViz';
import { Frequency } from 'scenes/Common/FrequencyViz';
import { ReachabilityStat } from 'scenes/Common/ReachabilityStatViz';
import { UptimeStat } from 'scenes/Common/UptimeStatViz';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { ResultsByTargetTable } from 'scenes/Scripted/ResultByTargetTable';
import { getMinStepFromFrequency } from 'scenes/utils';

export const ScriptedDashboard = ({ check }: { check: Check }) => {
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);
  const minStep = getMinStepFromFrequency(check.frequency);

  return (
    <DashboardContainer check={check} checkType={checkType}>
      <Stack height={`90px`}>
        <UptimeStat check={check} />
        <ReachabilityStat check={check} />
        <AvgLatency />
        <Frequency />
      </Stack>
      <TimepointExplorer check={check} />

      <div className={styles.errorRateRow}>
        <ErrorRateMap minStep={minStep} />
        <ErrorRate minStep={minStep} />
      </div>
      <Stack height={`200px`}>
        <Box width={`200px`}>
          <DistinctTargets query={getCountDistinctTargetsQuery({ metric: 'probe_http_info' })} />
        </Box>
        <DurationByProbe query={getSumDurationByProbeQuery({ metric: 'probe_http_total_duration_seconds' })} unit="s" />
      </Stack>
      <div className={styles.dataRow}>
        <DataSent query={getScriptedDataSentQuery()} />
        <DataReceived query={getScriptedDataReceivedQuery()} />
      </div>
      <AssertionsTable checkType={CheckType.Scripted} check={check} />
      <ResultsByTargetTable checkType={checkType} />
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
  dataRow: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    height: 200px;
  `,
});
