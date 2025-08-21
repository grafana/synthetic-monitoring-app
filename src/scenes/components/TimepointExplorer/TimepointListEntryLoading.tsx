import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ChunkyLoadingBar } from 'components/ChunkyLoadingBar/ChunkyLoadingBar';
import { TIMEPOINT_THEME_HEIGHT_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';

export const TimepointListEntryLoading = () => {
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const heightInPx = TIMEPOINT_THEME_HEIGHT_PX * (0.1 + Math.random() * 0.4);
  const color = useTheme2().colors.border.medium;

  return (
    <div className={styles.container}>
      <ChunkyLoadingBar color={color} direction="vertical" height={heightInPx} width={timepointWidth} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid ${theme.colors.border.medium};
      border-radius: ${theme.shape.radius.default};
      width: ${timepointWidth}px;
    `,
  };
};
