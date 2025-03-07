import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Toggletip } from 'components/Toggletip';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { Info } from 'page/CheckDrilldown/components/Info';
import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckProbeHealth } from 'page/CheckDrilldown/hooks/useCheckProbeHealth';

export const InfoProbe = () => {
  const { check } = useCheckDrilldown();
  const { timeRange } = useTimeRange();
  const { allProbesRunning, data = {}, isLoading } = useCheckProbeHealth({ check, timeRange });
  const styles = useStyles2(getStyles);
  const { changeTab } = useCheckDrilldown();

  const probeLength = check.probes.length;
  const probesWithResults = Object.keys(data);

  return (
    <Info label="No. of probes">
      <Stack>
        <div style={{ flexGrow: 1 }}>{probeLength}</div>
        {!isLoading && !allProbesRunning && (
          <Toggletip
            content={
              <Stack direction="column" gap={1}>
                <div>
                  Your probe is configured to have {probeLength} {pluralize('probe', probeLength)} but for the selected
                  time range, only {probesWithResults.length}
                  {` `}
                  {pluralize('probe', probesWithResults.length)} have returned results.
                </div>
                <div>
                  <Button variant="secondary" size="sm" onClick={() => changeTab(0)}>
                    Run investigation
                  </Button>
                </div>
              </Stack>
            }
          >
            <button className={styles.toggleButton} type="button">
              <Icon name={`exclamation-triangle`} size={'lg'} className={styles.warningIcon} />
            </button>
          </Toggletip>
        )}
      </Stack>
    </Info>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    toggleButton: css`
      background: none;
      border: none;
      padding: 0;
    `,
    warningIcon: css`
      color: ${theme.colors.warning.main};
    `,
  };
};

export function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`;
}
