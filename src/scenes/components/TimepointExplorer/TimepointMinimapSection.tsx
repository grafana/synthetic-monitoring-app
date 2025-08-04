import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { PlainButton } from 'components/PlainButton';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  ExecutionsInTimepoint,
  MiniMapSection,
  StatelessTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { getLabel } from 'scenes/components/TimepointExplorer/TimepointMinimapSection.utils';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

interface MiniMapSectionProps {
  index: number;
  section: MiniMapSection;
}

export const TimepointMiniMapSection = ({ index, section }: MiniMapSectionProps) => {
  const { handleMiniMapSectionChange, miniMapCurrentSectionIndex, timepoints, viewMode, timepointWidth } =
    useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const [start, end] = section;
  const miniMapSectionTimepoints = timepoints.slice(start, end + 1);
  const ref = useRef<HTMLButtonElement>(null);
  const label = getLabel(miniMapSectionTimepoints);
  const isActive = miniMapCurrentSectionIndex === index;

  return (
    <Tooltip content={label} ref={ref}>
      <PlainButton
        aria-label={label}
        className={cx(styles.section, { [styles.active]: isActive })}
        onClick={() => handleMiniMapSectionChange(index)}
        ref={ref}
      >
        <MinimapSectionAnnotations timepointsInRange={miniMapSectionTimepoints} />
        {miniMapSectionTimepoints.map((timepoint, index) => {
          if (viewMode === 'uptime') {
            return (
              <UptimeTimepoint key={timepoint.adjustedTime} timepoint={timepoint} timepointIndex={index + start} />
            );
          }

          return (
            <ReachabilityTimepoint key={timepoint.adjustedTime} timepoint={timepoint} timepointIndex={index + start} />
          );
        })}
      </PlainButton>
    </Tooltip>
  );
};

const UptimeTimepoint = ({ timepoint, timepointIndex }: { timepoint: StatelessTimepoint; timepointIndex: number }) => {
  const { maxProbeDuration, selectedTimepoint, timepointsDisplayCount, vizDisplay } = useTimepointExplorerContext();
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const width = `${100 / timepointsDisplayCount}%`;
  const state =
    statefulTimepoint.uptimeValue === 0 ? 'failure' : statefulTimepoint.uptimeValue === 1 ? 'success' : 'unknown';

  if (!vizDisplay.includes(state)) {
    return <div style={{ width }} />;
  }

  return (
    <TimepointVizItem
      key={timepoint.adjustedTime}
      className={cx(styles.uptimeTimepoint, {
        [styles.selected]: selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime,
      })}
      data-testid={`uptime-timepoint-${timepointIndex}`}
      state={state}
      style={{ height: `${height}%`, width }}
    />
  );
};

interface ReachabilityTimepointProps {
  timepoint: StatelessTimepoint;
  timepointIndex: number;
}

const ReachabilityTimepoint = ({ timepoint, timepointIndex }: ReachabilityTimepointProps) => {
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const { timepointsDisplayCount } = useTimepointExplorerContext();
  const width = `${100 / timepointsDisplayCount}%`;
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const ref = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    setContainer(ref.current);
  }, [ref.current?.clientWidth]);

  const containerHeight = container?.clientHeight ?? 0;
  const containerWidth = container?.clientWidth ?? 0;
  // the probe is half the container width (--size) and the center is half of that
  // so the offset is 1/4 of the container width
  const offset = containerWidth / 4;

  return (
    <div
      key={timepoint.adjustedTime}
      className={styles.reachabilityTimepoint}
      style={{ width }}
      ref={ref}
      data-testid={`reachability-timepoint-${timepointIndex}`}
    >
      {statefulTimepoint.executions.map((execution) => {
        return (
          <ExecutionEntry
            containerHeight={containerHeight}
            offset={offset}
            execution={execution}
            key={execution.id}
            timepoint={timepoint}
          />
        );
      })}
    </div>
  );
};

interface ExecutionEntryProps {
  containerHeight: number;
  offset: number;
  execution: ExecutionsInTimepoint;
  timepoint: StatelessTimepoint;
}

const ExecutionEntry = ({ containerHeight, offset, execution, timepoint }: ExecutionEntryProps) => {
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const { maxProbeDuration, selectedTimepoint, vizDisplay } = useTimepointExplorerContext();
  const probeSuccess = execution.execution[LokiFieldNames.Labels].probe_success;
  const probeDuration = Number(execution.execution[LokiFieldNames.Labels].duration_seconds) * 1000;
  const probeName = execution.probe;
  const bottom = getEntryHeight(probeDuration, maxProbeDuration) / 100;

  const bottomInPx = containerHeight * bottom - offset;
  const actualPosition = bottomInPx + offset > containerHeight ? containerHeight - offset : bottomInPx;
  const selected = selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime && selectedTimepoint[1] === probeName;
  const state = probeSuccess === '1' ? 'success' : probeSuccess === '0' ? 'failure' : 'unknown';

  if (!vizDisplay.includes(state)) {
    return <div />;
  }

  return (
    <TimepointVizItem
      key={probeName}
      className={cx(styles.reachabilityProbe, {
        [styles.selected]: selected,
      })}
      state={state}
      style={{ bottom: `${actualPosition}px` }}
    />
  );
};

const MinimapSectionAnnotations = ({ timepointsInRange }: { timepointsInRange: StatelessTimepoint[] }) => {
  const { annotations, timepointsDisplayCount } = useTimepointExplorerContext();
  const renderOrderedTimepoints = [...timepointsInRange].reverse();
  const styles = useStyles2(getAnnotationStyles);
  const timepointsInRangeAdjustedTimes = renderOrderedTimepoints.map((timepoint) => timepoint.adjustedTime);

  const annotationsToRender = annotations.filter((annotation) => {
    return timepointsInRangeAdjustedTimes.some((timepoint) => {
      return [annotation.timepointStart.adjustedTime, annotation.timepointEnd.adjustedTime].includes(timepoint);
    });
  });

  return (
    <div className={styles.container}>
      {annotationsToRender.map((annotation) => {
        const timepointEndIndex = renderOrderedTimepoints.findIndex(
          (timepoint) => timepoint.adjustedTime === annotation.timepointEnd.adjustedTime
        );
        const right = (100 / timepointsDisplayCount) * timepointEndIndex;

        return (
          <div
            key={annotation.checkEvent.label}
            className={styles.annotation}
            style={{
              right: `${right}%`,
            }}
          />
        );
      })}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number) => ({
  section: css`
    width: 100%;
    padding: 0;
    border: none;
    display: flex;
    height: 45px;
    align-items: end;
    background-color: transparent;
    justify-content: end;
    position: relative;
    z-index: 1;
    gap: ${theme.spacing(0.25)};

    &:before,
    &:after {
      content: '';
      height: 160%;
      left: 0;
      pointer-events: none;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
    }

    &:before {
      z-index: -1;
    }

    &:hover:before {
      background-color: ${theme.colors.background.secondary};
    }
  `,
  active: css`
    &:before {
      background-color: ${theme.colors.background.secondary};
    }

    &:after {
      border: 1px solid ${theme.colors.warning.border};
    }
  `,
  uptimeTimepoint: css`
    max-width: ${timepointWidth}px;
  `,
  reachabilityTimepoint: css`
    position: relative;
    height: 100%;
    display: flex;
    justify-content: center;
    max-width: ${timepointWidth}px;
  `,
  selected: css`
    background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
    z-index: 1;
  `,
  reachabilityProbe: css`
    --size: 50%;
    width: var(--size);
    padding-bottom: var(--size);
    position: absolute;
    border-radius: 50%;
  `,
});

const getAnnotationStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `,
    annotation: css`
      height: 100%;
      width: 1px;
      border: 1px dashed yellow;
      position: absolute;
      bottom: 0;
    `,
  };
};
