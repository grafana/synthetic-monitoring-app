import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, IconButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDate } from 'utils';
import { CheckLogsExplorer } from 'page/CheckDrilldown/components/CheckLogsExplorer';
import { ResultDuration } from 'page/CheckDrilldown/components/ResultDuration';
import { TimepointWithVis } from 'page/CheckDrilldown/components/TimepointExplorer.utils';

interface TimepointDetailProps {
  timepoint: TimepointWithVis;
  onClose: () => void;
}

export const TimepointDetail = ({ timepoint, onClose }: TimepointDetailProps) => {
  const { uptime, duration } = timepoint;
  const styles = useStyles2(getStyles);

  return (
    <Box borderColor={'weak'} padding={2} borderStyle={'solid'} position="relative">
      <IconButton name="times" onClick={onClose} aria-label="Close" className={styles.closeButton} />
      <Stack direction={`column`} gap={2}>
        <div className={styles.header}>
          <Text element={`h2`} variant="h3">
            {formatDate(timepoint.timestamp || ``, true)}
          </Text>
          <ResultDuration state={uptime} duration={duration} type={`up_down`} />
        </div>
        <CheckLogsExplorer timePoint={timepoint} />
      </Stack>
    </Box>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  closeButton: css`
    position: absolute;
    top: ${theme.spacing(1)};
    right: ${theme.spacing(1)};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: ${theme.spacing(2)};
  `,
});
