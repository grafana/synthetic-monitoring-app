import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TIMEPOINT_THEME_HEIGHT } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

const LINE_GAP = 16;
const GRID_MARKERS = Array.from({ length: 5 }, (_, index) => index);

export const GridMarkers = ({ maxProbeDurationData, width }: { maxProbeDurationData: number; width: number }) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack gap={1}>
      <div className={styles.container}>
        {GRID_MARKERS.map((marker) => {
          return <GridText key={marker} marker={marker} maxProbeDurationData={maxProbeDurationData} />;
        }).reverse()}
      </div>
      <div className={styles.container}>
        {GRID_MARKERS.map((marker) => {
          return <GridLine key={marker} marker={marker} maxProbeDurationData={maxProbeDurationData} width={width} />;
        }).reverse()}
      </div>
    </Stack>
  );
};

const GridText = ({ marker, maxProbeDurationData }: { marker: number; maxProbeDurationData: number }) => {
  const markerPercentage = (marker * 100) / (GRID_MARKERS.length - 1);
  const value = (markerPercentage * maxProbeDurationData) / 100;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.gridMarker}>
      <div className={styles.markerText}>{Math.round(value)}ms</div>
    </div>
  );
};

const GridLine = ({ width }: { marker: number; maxProbeDurationData: number; width: number }) => {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.gridMarker}>
      <div className={styles.line} style={{ width: width - LINE_GAP }} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    align-items: space-between;
    height: ${theme.spacing(TIMEPOINT_THEME_HEIGHT)};
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

  markerText: css`
    transform: translateY(-50%);
  `,
});
