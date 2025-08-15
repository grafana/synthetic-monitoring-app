import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { ExecutionEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { formatDuration, formatSmallDurations } from 'utils';
import { PlainButton } from 'components/PlainButton';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface TimepointListEntryTooltipProps {
  timepoint: StatelessTimepoint;
}

export const TimepointListEntryTooltip = ({ timepoint }: TimepointListEntryTooltipProps) => {
  const styles = useStyles2(getStyles);
  const { check, handleHoverStateChange, handleSelectedStateChange, hoveredState, selectedState } =
    useTimepointExplorerContext();
  const selectedProbeNames = useSceneVarProbes(check);

  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const displayTime = new Date(statefulTimepoint.adjustedTime).toLocaleString();
  const [hoveredTimepoint, hoveredProbeName, hoveredExecutionIndex] = hoveredState;
  const [selectedTimepoint, selectedProbeName, selectedExecutionIndex] = selectedState;
  const executions = Object.values(statefulTimepoint.probeResults).flat();

  // Calculate average if not provided
  const avgDuration =
    executions.reduce((sum, execution) => {
      const duration = Number(execution[LokiFieldNames.Labels].duration_seconds) * 1000;
      return sum + duration;
    }, 0) / executions.length;
  const renderedAvgDuration = Number.isNaN(avgDuration) ? `-` : formatSmallDurations(avgDuration);
  const renderedFrequency = !statefulTimepoint.config.frequency
    ? `-`
    : formatDuration(statefulTimepoint.config.frequency, true);

  const entriesToRender = selectedProbeNames
    .map((probeName) => {
      const probeResults = statefulTimepoint.probeResults[probeName] || [];

      if (probeResults) {
        return probeResults;
      }

      return [
        {
          [LokiFieldNames.Labels]: {
            probe: probeName,
            probe_success: '0',
            duration_seconds: '0',
          },
        } as ExecutionEndedLog,
      ];
    })
    .flat();

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
        {entriesToRender
          .sort((a, b) => a[LokiFieldNames.Labels].probe.localeCompare(b[LokiFieldNames.Labels].probe))
          .map((execution) => {
            const index = 0;
            const { probe: probeName, probe_success, duration_seconds } = execution[LokiFieldNames.Labels];
            const isSuccess = probe_success === '1';
            const duration = Number(duration_seconds) * 1000;
            const isSelected =
              statefulTimepoint.adjustedTime === selectedTimepoint?.adjustedTime &&
              selectedProbeName === probeName &&
              selectedExecutionIndex === index;
            const isHovered =
              statefulTimepoint.adjustedTime === hoveredTimepoint?.adjustedTime &&
              hoveredProbeName === probeName &&
              hoveredExecutionIndex === index;

            return (
              <div key={probeName} className={styles.probeRow}>
                <PlainButton
                  className={cx(styles.probeName, {
                    [styles.hovered]: isHovered,
                    [styles.selected]: isSelected,
                  })}
                  onClick={() => {
                    handleSelectedStateChange([statefulTimepoint, probeName, index]);
                  }}
                  onMouseEnter={() => handleHoverStateChange([statefulTimepoint, probeName, index])}
                  onMouseLeave={() => handleHoverStateChange([null, null, null])}
                >
                  {probeName}
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
      return <Badge color="gray" text="MISSING" />;
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
