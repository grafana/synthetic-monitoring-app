import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatSmallDurations } from 'utils';
import { TIMEPOINT_THEME_HEIGHT } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { getTextOffset } from 'scenes/components/TimepointExplorer/YAxis.utils';

const GRID_MARKERS = Array.from({ length: 5 }, (_, index) => index);

export const YAxis = ({ max, width }: { max: number; width: number }) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack gap={2}>
      <div className={styles.container}>
        {GRID_MARKERS.map((marker) => {
          return <GridText key={marker} marker={marker} max={max} />;
        }).reverse()}
      </div>
      <div className={styles.container}>
        {GRID_MARKERS.map((marker) => {
          return <GridLine key={marker} width={width} />;
        }).reverse()}
      </div>
    </Stack>
  );
};

const GridText = ({ marker, max }: { marker: number; max: number }) => {
  const markerPercentage = (marker * 100) / (GRID_MARKERS.length - 1);
  const value = (markerPercentage * max) / 100;
  const textOffset = getTextOffset(marker, GRID_MARKERS.length);
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.gridMarker} data-marker={marker}>
      <div style={{ transform: `translateY(${textOffset}%)` }}>{formatSmallDurations(value)}</div>
    </div>
  );
};

const GridLine = ({ width }: { width: number }) => {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.gridMarker}>
      <div className={styles.line} style={{ width }} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: ${theme.spacing(TIMEPOINT_THEME_HEIGHT)};
    font-size: ${theme.typography.bodySmall.fontSize};
    margin-top: ${theme.spacing(3)};
  `,
  line: css`
    height: 1px;
    background-color: ${theme.colors.border.weak};
    position: absolute;
    z-index: 0;
    left: 0;
    top: 0;
  `,
  gridMarker: css`
    position: relative;
  `,
});
