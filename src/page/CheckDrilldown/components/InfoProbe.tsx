import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Toggletip } from 'components/Toggletip';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { Info } from 'page/CheckDrilldown/components/Info';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';

export const InfoProbe = () => {
  const { check } = useCheckDrilldown();
  const { singleStats } = useCheckDrilldownInfo();
  const { probesWithResults } = singleStats;
  const probes = check.probes.length;
  const hasResults = probesWithResults !== null;
  const allProbesRunning = hasResults && probesWithResults === probes;
  const styles = useStyles2(getStyles);

  return (
    <Info label="No. of probes">
      <Stack>
        <div>{probes}</div>
        {!allProbesRunning && hasResults && (
          <Toggletip
            content={
              <Stack direction="column" gap={1}>
                <div>
                  Your probe is configured to have {probes} {pluralize('probe', probes)} but for the selected time
                  range, only {probesWithResults}
                  {` `}
                  {pluralize('probe', probesWithResults)} have returned results.
                </div>
                <div>
                  <Button variant="secondary" size="sm" onClick={() => {}}>
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

function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`;
}
