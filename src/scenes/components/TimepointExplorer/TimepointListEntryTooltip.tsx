import React, { useCallback } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackTimepointDetailsClicked } from 'features/tracking/timepointExplorerEvents';

import { formatDuration } from 'utils';
import { PlainButton } from 'components/PlainButton';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  useSelectedProbeNames,
  useStatefulTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint, TimepointStatus } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  getAverageDuration,
  getEntriesToRender,
  matchState,
} from 'scenes/components/TimepointExplorer/TimepointListEntryTooltip.utils';

interface TimepointListEntryTooltipProps {
  timepoint: StatelessTimepoint;
}

export const TimepointListEntryTooltip = ({ timepoint }: TimepointListEntryTooltipProps) => {
  const styles = useStyles2(getStyles);
  const { currentAdjustedTime, handleHoverStateChange, handleViewerStateChange, hoveredState, viewerState } =
    useTimepointExplorerContext();

  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const displayTime = dateTimeFormat(statefulTimepoint.adjustedTime, {
    format: 'yyyy/MM/DD HH:mm:ss',
  });

  const renderedAvgDuration = getAverageDuration(statefulTimepoint.probeResults);
  const renderedFrequency = formatDuration(statefulTimepoint.config.frequency, true);
  const selectedProbeNames = useSelectedProbeNames(statefulTimepoint);

  const entriesToRender = getEntriesToRender({
    statefulTimepoint,
    selectedProbeNames,
    currentAdjustedTime,
  });

  const handleProbeClick = useCallback(
    (probeName: string, index: number) => {
      trackTimepointDetailsClicked({
        component: 'tooltip',
        status: statefulTimepoint.status,
      });
      handleViewerStateChange([statefulTimepoint, probeName, index]);
    },
    [statefulTimepoint, handleViewerStateChange]
  );

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.header}>
        <Stack direction="row" alignItems="center" gap={3} justifyContent="space-between">
          <Text variant="h5" element="h3">
            {displayTime}
          </Text>
          <StatusBadge status={statefulTimepoint.status} type="uptime" />
        </Stack>
      </div>

      <Stack direction="column" gap={1}>
        {entriesToRender
          .sort((a, b) => a.probeName.localeCompare(b.probeName))
          .map((entry) => {
            const { status, probeName, duration, index } = entry;
            const isSelected = matchState(viewerState, [statefulTimepoint, probeName, index]);
            const isHovered = matchState(hoveredState, [statefulTimepoint, probeName, index]);

            return (
              <div key={probeName} className={styles.probeRow}>
                <PlainButton
                  className={cx(styles.probeName, {
                    [styles.hovered]: isHovered,
                    [styles.selected]: isSelected,
                  })}
                  onClick={() => handleProbeClick(probeName, index)}
                  onMouseEnter={() => handleHoverStateChange([statefulTimepoint, probeName, index])}
                  onMouseLeave={() => handleHoverStateChange([])}
                >
                  {probeName}
                </PlainButton>
                <Stack direction="row" gap={1} alignItems="center">
                  <StatusBadge status={status} type="reachability" />
                  <span className={styles.duration}>{duration}</span>
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

const StatusBadge = ({ status, type }: { status: TimepointStatus; type: 'uptime' | 'reachability' }) => {
  const missingText = type === 'uptime' ? 'UNKNOWN' : 'MISSING';
  const successText = type === 'uptime' ? 'UP' : 'SUCCESS';
  const failureText = type === 'uptime' ? 'DOWN' : 'FAILURE';

  switch (status) {
    case 'missing':
      return <Badge color="darkgrey" text={missingText} />;
    case 'success':
      return <Badge color="green" text={successText} />;
    case 'failure':
      return <Badge color="red" text={failureText} />;
    case 'pending':
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
    gap: ${theme.spacing(2)};
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
