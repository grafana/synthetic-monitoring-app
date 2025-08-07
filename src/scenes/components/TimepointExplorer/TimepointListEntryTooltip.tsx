import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { formatDuration, formatSmallDurations } from 'utils';
import { PlainButton } from 'components/PlainButton';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getIsExecutionSelected } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface TimepointListEntryTooltipProps {
  timepoint: StatelessTimepoint;
}

export const TimepointListEntryTooltip = ({ timepoint }: TimepointListEntryTooltipProps) => {
  const styles = useStyles2(getStyles);
  const { handleExecutionHover, handleSelectedTimepointChange, hoveredExecution, selectedTimepoint } =
    useTimepointExplorerContext();
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const displayTime = new Date(statefulTimepoint.adjustedTime).toLocaleString();
  const probeCount = statefulTimepoint.executions.length;

  // Calculate average if not provided
  const avgDuration =
    statefulTimepoint.executions.reduce((sum, execution) => {
      const duration = Number(execution.execution[LokiFieldNames.Labels].duration_seconds) * 1000;
      return sum + duration;
    }, 0) / probeCount;
  const renderedAvgDuration = Number.isNaN(avgDuration) ? `-` : formatSmallDurations(avgDuration);
  const renderedFrequency = !statefulTimepoint.config.frequency
    ? `-`
    : formatDuration(statefulTimepoint.config.frequency, true);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.header}>
        <Stack direction="row" alignItems="center" gap={3} justifyContent="space-between">
          <Text variant="h5" element="h3">
            {displayTime}
          </Text>
          <StatusBadge status={statefulTimepoint.uptimeValue} />
        </Stack>
      </div>

      <Stack direction="column" gap={1}>
        {statefulTimepoint.executions
          .sort((a, b) => a.probe.localeCompare(b.probe))
          .map((execution) => {
            const executionId = execution.id;
            const { probe, probe_success, duration_seconds } = execution.execution[LokiFieldNames.Labels];
            const isSuccess = probe_success === '1';
            const duration = Number(duration_seconds) * 1000;
            const isSelected = getIsExecutionSelected(statefulTimepoint, executionId, selectedTimepoint);
            const isHovered = hoveredExecution === executionId;

            return (
              <div key={probe} className={styles.probeRow}>
                <PlainButton
                  className={cx(styles.probeName, {
                    [styles.hovered]: isHovered,
                    [styles.selected]: isSelected,
                  })}
                  onClick={() => {
                    handleSelectedTimepointChange(statefulTimepoint, executionId);
                  }}
                  onMouseEnter={() => handleExecutionHover(executionId)}
                  onMouseLeave={() => handleExecutionHover(null)}
                >
                  {probe}
                </PlainButton>
                <Stack direction="row" gap={1} alignItems="center">
                  <Badge color={isSuccess ? 'green' : 'red'} text={isSuccess ? 'Success' : 'Fail'} />
                  <span className={styles.duration}>{formatSmallDurations(duration)}</span>
                </Stack>
              </div>
            );
          })}
      </Stack>

      <div className={styles.footer}>
        <span>Frequency: {renderedFrequency}</span>
        <span>Avg: {renderedAvgDuration}</span>
      </div>
    </Stack>
  );
};

const StatusBadge = ({ status }: { status: -1 | 0 | 1 | 2 }) => {
  switch (status) {
    case -1:
      // @ts-expect-error - it does accept gray...
      return <Badge color="gray" text="UNKNOWN" />;
    case 1:
      return <Badge color="green" text="UP" />;
    case 0:
      return <Badge color="red" text="DOWN" />;
    case 2:
      return <Badge color="blue" text="PENDING" />;
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
  selected: css`
    font-weight: 700;
  `,
  probeName: css`
    font-size: ${theme.typography.bodySmall.fontSize};

    &:hover {
      text-decoration: underline;
    }
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
