import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { DashboardContainer } from 'scenes/Common/DashboardContainer';
import { ErrorLogs } from 'scenes/Common/ErrorLogsPanel';
import { Frequency } from 'scenes/Common/FrequencyViz';
import { UptimeStat } from 'scenes/Common/UptimeStatViz';
import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';

import {
  CriteriaPassRate,
  CriterionPassFail,
  EvalScore,
  JudgeTokens,
  TargetLatency,
} from './panels';

export const LLMEvaluatorDashboard = ({ check }: { check: Check }) => {
  const styles = useStyles2(getStyles);

  return (
    <DashboardContainer check={check} checkType={CheckType.LlmEvaluator}>
      <Stack height="90px">
        <UptimeStat check={check} />
        <CriteriaPassRate />
        <Frequency />
      </Stack>

      <div className={styles.fullWidth}>
        <EvalScore />
      </div>

      <div className={styles.fullWidth}>
        <CriterionPassFail />
      </div>

      <div className={styles.twoCol}>
        <TargetLatency />
        <JudgeTokens />
      </div>

      <TimepointExplorer check={check} />
      <ErrorLogs startingUnsuccessfulOnly />
    </DashboardContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  fullWidth: css`
    height: 250px;
  `,
  twoCol: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    height: 250px;
  `,
});
