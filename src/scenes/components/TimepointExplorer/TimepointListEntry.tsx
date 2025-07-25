import React, { useRef, useState } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, styleMixins, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { PlainButton } from 'components/PlainButton';
import {
  TIMEPOINT_GAP_PX,
  TIMEPOINT_THEME_HEIGHT_PX,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { CheckEventType, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryTooltip } from 'scenes/components/TimepointExplorer/TimepointListEntryTooltip';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

interface TimepointListEntryProps {
  timepoint: StatelessTimepoint;
  viewIndex: number;
}

export const TimepointListEntry = ({ timepoint, viewIndex }: TimepointListEntryProps) => {
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);

  return (
    <div className={styles.timepoint}>
      <Entry timepoint={timepoint} viewIndex={viewIndex} />
    </div>
  );
};

const Entry = (props: TimepointListEntryProps) => {
  const { annotations, viewMode } = useTimepointExplorerContext();
  const isCheckCreatedEntry = annotations.some(
    (annotation) =>
      annotation.timepointStart.adjustedTime === props.timepoint.adjustedTime &&
      annotation.checkEvent.label === CheckEventType.CHECK_CREATED
  );

  if (isCheckCreatedEntry) {
    return <div data-testid={`empty-timepoint-${props.timepoint.adjustedTime}`} />;
  }

  if (viewMode === 'uptime') {
    return <UptimeEntry {...props} />;
  }

  return <ReachabilityEntry {...props} />;
};

const ICON_MAP: Record<number, IconName> = {
  [-1]: 'question-circle',
  [0]: 'times',
  [1]: 'check',
};

const GLOBAL_CLASS = `uptime_bar`;

const UptimeEntry = ({ timepoint, viewIndex }: TimepointListEntryProps) => {
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const { handleSelectedTimepointChange, maxProbeDuration, selectedTimepoint, vizDisplay, timepointWidth } =
    useTimepointExplorerContext();

  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const styles = useStyles2(getStyles, timepointWidth);
  const executionToView = statefulTimepoint.executions[0]?.id;
  const isSelected = selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime;
  const ref = useRef<HTMLButtonElement>(null);
  const state =
    statefulTimepoint.uptimeValue === 0 ? 'failure' : statefulTimepoint.uptimeValue === 1 ? 'success' : 'unknown';

  if (!vizDisplay.includes(state)) {
    return <div />;
  }

  return (
    <div style={{ height: `${height}%` }}>
      <Tooltip
        content={<TimepointListEntryTooltip statefulTimepoint={statefulTimepoint} />}
        ref={ref}
        interactive
        placement="top"
      >
        <PlainButton
          className={styles.uptimeButton}
          ref={ref}
          onClick={() => handleSelectedTimepointChange(timepoint, executionToView)}
          style={viewIndex === 0 ? { paddingLeft: 0 } : undefined}
          showFocusStyles={false}
        >
          <TimepointVizItem
            className={cx(styles.uptimeBar, GLOBAL_CLASS, {
              [styles.selected]: isSelected,
            })}
            state={state}
          >
            <Icon name={ICON_MAP[statefulTimepoint.uptimeValue]} />
          </TimepointVizItem>
        </PlainButton>
      </Tooltip>
    </div>
  );
};

const ReachabilityEntry = ({ timepoint }: TimepointListEntryProps) => {
  const { vizDisplay, timepointWidth } = useTimepointExplorerContext();
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const styles = useStyles2(getStyles, timepointWidth);
  const { handleSelectedTimepointChange, maxProbeDuration, selectedTimepoint } = useTimepointExplorerContext();
  const entryHeight = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const [hoveredCheck, setHoveredCheck] = useState<string | null>(null);

  // add the timepoint size to the height so the entries are rendered in the middle of the Y Axis line
  const height = `calc(${entryHeight}% + ${timepointWidth}px)`;

  const executionsToRender = statefulTimepoint.executions.filter(({ execution }) => {
    const probeSuccess = execution[LokiFieldNames.Labels].probe_success;
    const state = probeSuccess === '1' ? 'success' : probeSuccess === '0' ? 'failure' : 'unknown';

    return vizDisplay.includes(state);
  });

  if (!executionsToRender.length) {
    return <div key={timepoint.adjustedTime} />;
  }

  return (
    <Tooltip
      content={
        <TimepointListEntryTooltip
          statefulTimepoint={{
            ...statefulTimepoint,
            executions: executionsToRender,
          }}
          hoveredCheck={hoveredCheck}
        />
      }
      interactive
      placement="top"
    >
      <div className={styles.reachabilityEntry} style={{ height }}>
        {statefulTimepoint.executions.map(({ execution }) => {
          const duration = Number(execution[LokiFieldNames.Labels].duration_seconds) * 1000;
          const height = getEntryHeight(duration, maxProbeDuration);
          const pixelHeight = TIMEPOINT_THEME_HEIGHT_PX * (height / 100);
          const probeSuccess = execution[LokiFieldNames.Labels].probe_success;
          const checkId = execution.id;
          const [timepointToView, checkToView] = selectedTimepoint;
          const isTimepointSelected = timepointToView?.adjustedTime === timepoint.adjustedTime;
          const isProbeSelected = checkId === checkToView;
          const isSelected = isTimepointSelected && isProbeSelected;
          const state = probeSuccess === '1' ? 'success' : probeSuccess === '0' ? 'failure' : 'unknown';

          if (!vizDisplay.includes(state)) {
            return null;
          }

          return (
            <TimepointVizItem
              as={PlainButton}
              className={cx(styles.reachabilityProbe, {
                [styles.selected]: isSelected,
              })}
              key={checkId}
              onClick={() => handleSelectedTimepointChange(timepoint, checkId)}
              onMouseEnter={() => setHoveredCheck(checkId)}
              onMouseLeave={() => setHoveredCheck(null)}
              style={{
                bottom: `${pixelHeight}px`,
              }}
              state={state}
            >
              <Icon name={ICON_MAP[probeSuccess]} />
            </TimepointVizItem>
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
      width: ${timepointWidth}px;
      height: 100%;
      position: relative;
    `,
    uptimeButton: css`
      width: calc(${timepointWidth}px + ${TIMEPOINT_GAP_PX}px);
      height: 100%;
      left: 50%;
      transform: translateX(-50%);
      position: relative;
      display: flex;
      justify-content: center;

      &:hover {
        .${GLOBAL_CLASS} {
          // todo: work out why this needs a global class?
          background-color: ${theme.visualization.getColorByName(`green`)};
        }
      }

      &:focus-visible {
        .${GLOBAL_CLASS} {
          ${styleMixins.getFocusStyles(theme)}
        }
      }
    `,
    uptimeBar: css`
      height: 100%;
      min-height: 2px;
      width: ${timepointWidth}px;
      display: flex;
      align-items: end;
      justify-content: center;
      position: relative;
      border-radius: ${theme.shape.radius.default};
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
    selected: css`
      border-width: 2px;
      z-index: 1;
    `,
    reachabilityProbe: css`
      position: absolute;
      width: ${timepointWidth}px;
      height: ${timepointWidth}px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transform: translateY(50%);

      &:hover {
        background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
        z-index: 1;
      }
    `,
  };
};
