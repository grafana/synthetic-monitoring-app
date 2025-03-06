import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDuration, formatUptime } from 'page/CheckDrilldown/components/CheckExplorer.utils';
import { StatPanel } from 'page/CheckDrilldown/components/StatPanel';
import { TimepointExplorer } from 'page/CheckDrilldown/components/TimepointExplorer';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';

export const CheckExplorer = () => {
  const { singleStats } = useCheckDrilldownInfo();
  const uptimeFormatted = formatUptime(singleStats.uptime);
  const durationFormatted = formatDuration(singleStats.duration);
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.container}>
        <StatPanel label="Uptime" value={uptimeFormatted} />
        <StatPanel label="Avg. probe duration" value={durationFormatted} />
      </div>
      <TimepointExplorer />
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    gap: ${theme.spacing(4)};
    padding-bottom: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
});
