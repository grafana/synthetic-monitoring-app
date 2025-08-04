import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { formatDuration, formatSmallDurations } from 'utils';
import { PlainButton } from 'components/PlainButton';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getIsExecutionSelected } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface TimepointListEntryTooltipProps {
  statefulTimepoint: StatefulTimepoint;
}

export const TimepointListEntryTooltip = ({ statefulTimepoint }: TimepointListEntryTooltipProps) => {
  const styles = useStyles2(getStyles);
  const { handleExecutionHover, handleSelectedTimepointChange, hoveredExecution, selectedTimepoint } =
    useTimepointExplorerContext();
  const displayTime = new Date(statefulTimepoint.adjustedTime).toLocaleString();
  const probeCount = statefulTimepoint.executions.length;

  // Calculate average if not provided
  const avgDuration =
    statefulTimepoint.executions.reduce((sum, execution) => {
      const duration = Number(execution.execution[LokiFieldNames.Labels].duration_seconds) * 1000;
      return sum + duration;
    }, 0) / probeCount;

  const renderedAvgDuration = Number.isNaN(avgDuration) ? `-` : formatSmallDurations(avgDuration);

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
        {statefulTimepoint.executions.map((execution) => {
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

      {/* Footer */}
      <div className={styles.footer}>
        <span>Frequency: {formatDuration(statefulTimepoint.frequency, true)}</span>
        <span>Avg: {renderedAvgDuration}</span>
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
