import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { PlainButton } from 'components/PlainButton';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

const VIZ_STATES = [`failure`, `success`, `unknown`] as const;

export const TimepointListVizLegend = () => {
  const styles = useStyles2(getStyles);

  return (
    <Stack gap={1.5}>
      {VIZ_STATES.map((value) => {
        return (
          <Stack key={value} alignItems="center">
            <PlainButton onClick={() => {}}>
              <TimepointVizItem className={styles.legendItem} state={value} />
            </PlainButton>
            <PlainButton onClick={() => {}}>{value}</PlainButton>
          </Stack>
        );
      })}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  legendItem: css`
    width: 14px;
    height: 4px;
    border-radius: ${theme.shape.radius.pill};
  `,
});
