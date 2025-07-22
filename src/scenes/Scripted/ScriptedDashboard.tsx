// @ts-nocheck
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
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { DataReceived } from 'scenes/Common/DataReceived';
import { DataSent } from 'scenes/Common/DataSent';
import { DistinctTargets } from 'scenes/Common/DistinctTargets';
import { DurationByProbe } from 'scenes/Common/DurationByProbe';
import { ReachabilityStat } from 'scenes/Common/ReachabilityStatViz';
import { UptimeStat } from 'scenes/Common/UptimeStatViz';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { ResultsByTargetTable } from 'scenes/Scripted/ResultByTargetTable';

export const ScriptedDashboard = ({ check }: { check: Check }) => {
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);

  return (
    <DashboardContainer check={check} checkType={checkType}>
      <TimepointExplorer check={check} />
      {/* <div className={styles.header}>
        <UptimeStat check={check} />
        <ReachabilityStat check={check} />
      </div>
      <AssertionsTable checkType={CheckType.Scripted} check={check} />
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
      <ResultsByTargetTable checkType={checkType} /> */}
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
