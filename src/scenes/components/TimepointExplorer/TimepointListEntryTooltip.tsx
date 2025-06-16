import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { formatDuration, formatSmallDurations } from 'utils';
import { Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface TimepointListEntryTooltipProps {
  timepoint: Timepoint;
  hoveredProbe?: string | null;
}

export const TimepointListEntryTooltip = ({ timepoint, hoveredProbe }: TimepointListEntryTooltipProps) => {
  const styles = useStyles2(getStyles);
  const displayTime = new Date(timepoint.adjustedTime).toLocaleString();
  const probeCount = timepoint.probes.length;

  // Calculate average if not provided
  const avgDuration =
    timepoint.probes.reduce((sum, probe) => {
      const duration = Number(probe[LokiFieldNames.Labels].duration_seconds) * 1000;
      return sum + duration;
    }, 0) / probeCount;

  return (
    <Stack direction="column" gap={2}>
      {/* Header */}
      <div className={styles.header}>
        <Stack direction="row" alignItems="center" gap={3} justifyContent="space-between">
          <Text variant="h5" element="h3">
            {displayTime}
          </Text>
          <StatusBadge status={timepoint.uptimeValue} />
        </Stack>
      </div>

      {/* Probe List */}
      <Stack direction="column" gap={1}>
        {timepoint.probes.map((entry) => {
          const { probe, probe_success, duration_seconds } = entry[LokiFieldNames.Labels];
          const isSuccess = probe_success === '1';
          const duration = Number(duration_seconds) * 1000;

          return (
            <div key={probe} className={styles.probeRow}>
              <span className={cx(styles.probeName, { [styles.hovered]: hoveredProbe === probe })}>{probe}</span>
              <Stack direction="row" gap={1} alignItems="center">
                <Badge color={isSuccess ? 'green' : 'red'} text={isSuccess ? 'Success' : 'Fail'} />
                <span className={styles.duration}>{formatSmallDurations(duration)}</span>
              </Stack>
            </div>
          );
        })}
      </Stack>

      {/* Footer */}
      <div className={styles.footer}>
        <span>Frequency: {formatDuration(timepoint.frequency, true)}</span>
        <span>Avg: {formatSmallDurations(avgDuration)}</span>
      </div>
    </Stack>
  );
};

const StatusBadge = ({ status }: { status: number }) => {
  switch (status) {
    case 1:
      return <Badge color="green" text="UP" />;
    case 0:
      return <Badge color="red" text="DOWN" />;
    default:
      return <Badge color="orange" text="UNKNOWN" />;
  }
};

const getStyles = (theme: GrafanaTheme2) => ({
  header: css`
    padding-bottom: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  date: css`
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  avgLabel: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
  probeRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  hovered: css`
    text-decoration: underline;
  `,
  probeName: css`
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  duration: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
    min-width: 40px;
    text-align: right;
  `,
  footer: css`
    display: flex;
    justify-content: space-between;
    padding-top: ${theme.spacing(1)};
    border-top: 1px solid ${theme.colors.border.weak};
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
});
