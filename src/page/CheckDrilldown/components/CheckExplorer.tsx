import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDuration, formatUptime } from 'page/CheckDrilldown/components/CheckExplorer.utils';
import { StatPanel } from 'page/CheckDrilldown/components/StatPanel';
import { TimepointExplorer } from 'page/CheckDrilldown/components/TimepointExplorer';
import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';

export const CheckExplorer = () => {
  const { timeRange } = useTimeRange();
  const { uptime, duration, reachability } = useCheckDrilldownInfo();
  const uptimeMeanPercentage = uptime ? convertToPercentage(getMean(uptime)) : null;
  const reachabilityMeanPercentage = reachability ? convertToPercentage(getMean(reachability)) : null;
  const durationMean = duration ? getMean(probesCombined(duration)) : null;
  const uptimeFormatted = formatUptime(uptimeMeanPercentage);
  const reachabilityFormatted = formatUptime(reachabilityMeanPercentage);
  const durationFormatted = formatDuration(durationMean);
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.container}>
        <StatPanel label="Uptime" value={uptimeFormatted} />
        <StatPanel label="Reachability" value={reachabilityFormatted} />
        <StatPanel label="Avg. probe duration" value={durationFormatted} />
      </div>
      <TimepointExplorer key={`${timeRange.from.valueOf()}-${timeRange.to.valueOf()}`} />
    </Stack>
  );
};

function probesCombined(duration: Record<string, Array<[number, number]>>) {
  const probes = Object.values(duration);

  return probes.flat();
}

function getMean(values: Array<[number, number]>) {
  const reduced = values.reduce((acc, [_, value]) => {
    return acc + value;
  }, 0);

  return reduced / values.length;
}

function convertToPercentage(value: number) {
  return (value * 100).toFixed(2);
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    gap: ${theme.spacing(4)};
    padding-bottom: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
});
