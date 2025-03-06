import React, { useCallback, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TimepointBar } from 'page/CheckDrilldown/components/TimepointBar';
import { TimepointDetail } from 'page/CheckDrilldown/components/TimepointDetail';
import { createVisualisation } from 'page/CheckDrilldown/components/TimepointExplorer.utils';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';

const EXPLORER_HEIGHT = 300; // TODO: make this dynamic
// const MAX_VISIBLE_TIMEPOINTS = 120;

export const TimepointExplorer = () => {
  const [selectedTimepoint, setSelectedTimepoint] = useState<number | null>(null);
  const styles = useStyles2(getStyles);

  const { timePoints } = useCheckDrilldownInfo();
  const visualisation = useMemo(() => createVisualisation(timePoints, EXPLORER_HEIGHT), [timePoints]);

  const handleTimepointClick = useCallback((index: number) => {
    setSelectedTimepoint(index);
  }, []);

  const handleCloseTimepointDetail = useCallback(() => {
    setSelectedTimepoint(null);
  }, []);

  const visibleTimepoints = useMemo(() => {
    return visualisation;
  }, [visualisation]);

  const timepointDetail = useMemo(
    () => (selectedTimepoint !== null ? visualisation[selectedTimepoint] : null),
    [selectedTimepoint, visualisation]
  );

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="column" gap={0.5}>
        <Text element="h2" variant="h6">
          Timepoint Explorer
        </Text>
        <Text italic variant={`bodySmall`}>{`Showing ${visualisation.length} timepoints`}</Text>
      </Stack>
      <div className={styles.container}>
        <div className={styles.timepointContainer}>
          {visibleTimepoints.map((timepoint, index) => {
            const isSelected = selectedTimepoint === index;

            return (
              <TimepointBar
                key={timepoint.timestamp}
                timepoint={timepoint}
                onClick={() => {
                  if (isSelected) {
                    handleCloseTimepointDetail();
                  } else {
                    handleTimepointClick(index);
                  }
                }}
                isSelected={isSelected}
              />
            );
          })}
        </div>
      </div>
      {timepointDetail ? (
        <TimepointDetail timepoint={timepointDetail} onClose={handleCloseTimepointDetail} />
      ) : (
        <TimepointZeroState />
      )}
    </Stack>
  );
};

const TimepointZeroState = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.zeroState}>
      <Text variant="h2">Select a timepoint to view details.</Text>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    overflow: auto;
  `,
  timepointContainer: css`
    align-items: flex-end;
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(1)};
    height: ${EXPLORER_HEIGHT}px;
    width: 100%;
    padding: ${theme.spacing(
      0,
      1,
      1
    )}; // not being applied correctly because of the overflow, might need to pad with elements
  `,
  zeroState: css`
    border: 1px solid ${theme.colors.border.weak};
    height: 250px;
    padding: ${theme.spacing(2)};
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  `,
});
