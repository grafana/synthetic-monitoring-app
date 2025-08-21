import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { PlainButton } from 'components/PlainButton';
import {
  TIMEPOINT_GAP_PX,
  TIMEPOINT_THEME_HEIGHT_PX,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight, getIsProbeBeingViewed } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryTooltip } from 'scenes/components/TimepointExplorer/TimepointListEntryTooltip';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

interface TimepointListEntryProps {
  timepoint: StatelessTimepoint;
}

const ICON_MAP: Record<number, IconName> = {
  [0]: 'times',
  [1]: 'check',
};

export const TimepointListEntryReachability = ({ timepoint }: TimepointListEntryProps) => {
  const {
    handleHoverStateChange,
    handleViewerStateChange,
    hoveredState,
    maxProbeDuration,
    timepointWidth,
    viewerState,
    vizDisplay,
  } = useTimepointExplorerContext();
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const styles = useStyles2(getStyles, timepointWidth);
  const entryHeight = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const [hoveredTimepoint, hoveredProbeName, hoveredExecutionIndex] = hoveredState || [];

  // add the timepoint size to the height so the entries are rendered in the middle of the Y Axis line
  const height = `calc(${entryHeight}% + ${timepointWidth}px)`;

  const executionsToRender = Object.values(statefulTimepoint.probeResults)
    .flat()
    .filter((execution) => {
      const probeSuccess = execution[LokiFieldNames.Labels].probe_success;
      const state = probeSuccess === '1' ? 'success' : probeSuccess === '0' ? 'failure' : 'missing';

      return vizDisplay.includes(state);
    });

  if (!executionsToRender.length) {
    return <div key={timepoint.adjustedTime} />;
  }

  return (
    <Tooltip content={<TimepointListEntryTooltip timepoint={timepoint} />} interactive placement="top">
      <div className={styles.reachabilityEntry} style={{ height }}>
        {executionsToRender.map((execution) => {
          const index = 0;
          const duration = Number(execution[LokiFieldNames.Labels].duration_seconds) * 1000;
          const height = getEntryHeight(duration, maxProbeDuration);
          const pixelHeight = TIMEPOINT_THEME_HEIGHT_PX * (height / 100);
          const { probe: probeName, probe_success } = execution[LokiFieldNames.Labels];
          const isBeingViewed = getIsProbeBeingViewed(timepoint, probeName, viewerState);
          const status = probe_success === '1' ? 'success' : probe_success === '0' ? 'failure' : 'missing';

          if (!vizDisplay.includes(status)) {
            return null;
          }

          const isHovered =
            timepoint.adjustedTime === hoveredTimepoint?.adjustedTime &&
            hoveredProbeName === probeName &&
            hoveredExecutionIndex === index;

          return (
            <div
              className={styles.executionContainer}
              key={`${probeName}-${index}`}
              style={{ bottom: `${pixelHeight}px` }}
            >
              {isBeingViewed && (
                <div className={styles.viewerIcon}>
                  <Icon name="eye" />
                </div>
              )}
              <TimepointVizItem
                as={PlainButton}
                className={cx(styles.reachabilityExecution, {
                  [styles.hovered]: isHovered,
                  [styles.viewed]: isBeingViewed,
                })}
                onClick={() => handleViewerStateChange([timepoint, probeName, index])}
                onMouseEnter={() => handleHoverStateChange([timepoint, probeName, index])}
                onMouseLeave={() => handleHoverStateChange([])}
                status={status}
              >
                <Icon name={ICON_MAP[probe_success]} />
              </TimepointVizItem>
            </div>
          );
        })}
      </div>
    </Tooltip>
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number) => {
  return {
    timepoint: css`
      display: flex;
      justify-content: end;
      flex-direction: column;
      height: 100%;
      position: relative;
      width: ${timepointWidth + TIMEPOINT_GAP_PX}px;
    `,
    reachabilityEntry: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: end;
      width: ${timepointWidth + TIMEPOINT_GAP_PX}px;
      position: relative;
      left: 50%;
      transform: translateX(-50%);
    `,
    executionContainer: css`
      position: absolute;
      bottom: 0;
      transform: translateY(50%);
      display: flex;
      justify-content: center;
    `,
    reachabilityExecution: css`
      width: ${timepointWidth}px;
      height: ${timepointWidth}px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      &:after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
        opacity: 0;
        pointer-events: none;
        border-radius: 50%;
      }
    `,
    viewed: css`
      border-width: 2px;
      z-index: 1;
    `,
    hovered: css`
      &:after {
        opacity: 0.3;
      }
    `,
    viewerIcon: css`
      position: absolute;
      bottom: 100%;
    `,
    pendingEntry: css`
      width: ${timepointWidth}px;
      background-color: ${theme.colors.background.primary};
    `,
  };
};
