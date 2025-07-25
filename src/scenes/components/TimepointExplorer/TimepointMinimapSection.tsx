import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { PlainButton } from 'components/PlainButton';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { MiniMapSection, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { getLabel } from 'scenes/components/TimepointExplorer/TimepointMinimapSection.utils';

interface MiniMapSectionProps {
  index: number;
  section: MiniMapSection;
}

export const TimepointMiniMapSection = ({ index, section }: MiniMapSectionProps) => {
  const { handleMiniMapSectionClick, miniMapCurrentSectionIndex, timepoints, viewMode } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);
  const miniMapSectionTimepoints = timepoints.slice(section[0], section[1]);
  const ref = useRef<HTMLButtonElement>(null);
  const label = getLabel(miniMapSectionTimepoints);
  const isActive = miniMapCurrentSectionIndex === index;

  return (
    <div className={styles.container}>
      <Tooltip content={label} ref={ref}>
        <PlainButton
          aria-label={label}
          className={cx(styles.section, { [styles.active]: isActive })}
          onClick={() => handleMiniMapSectionClick(index)}
          ref={ref}
        >
          <MinimapSectionAnnotations timepointsInRange={miniMapSectionTimepoints} />
          {viewMode === 'uptime' ? (
            <UptimeSection timepoints={miniMapSectionTimepoints} />
          ) : (
            <ReachabilitySection timepoints={miniMapSectionTimepoints} />
          )}
        </PlainButton>
      </Tooltip>
    </div>
  );
};

interface SectionChildProps {
  timepoints: StatelessTimepoint[];
}

const UptimeSection = ({ timepoints }: SectionChildProps) => {
  const { logsMap, maxProbeDuration, selectedTimepoint, timepointsDisplayCount } = useTimepointExplorerContext();

  const styles = useStyles2(getStyles);
  const width = `${100 / timepointsDisplayCount}%`;

  return timepoints.map((timepoint) => {
    const statefulTimepoint = logsMap[timepoint.adjustedTime];

    if (!statefulTimepoint) {
      return null;
    }

    const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);

    return (
      <div
        key={timepoint.adjustedTime}
        className={cx(styles.uptimeTimepoint, {
          [styles.success]: statefulTimepoint.uptimeValue === 1,
          [styles.failure]: statefulTimepoint.uptimeValue === 0,
          [styles.selected]: selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime,
        })}
        style={{ height: `${height}%`, width }}
      />
    );
  });
};

const ReachabilitySection = ({ timepoints }: SectionChildProps) => {
  return timepoints.map((timepoint) => {
    return <ReachabilityTimepoint key={timepoint.adjustedTime} timepoint={timepoint} />;
  });
};

interface ReachabilityTimepointProps {
  timepoint: StatelessTimepoint;
}

const ReachabilityTimepoint = ({ timepoint }: ReachabilityTimepointProps) => {
  const { maxProbeDuration, selectedTimepoint, timepointsDisplayCount } = useTimepointExplorerContext();
  const width = `${100 / timepointsDisplayCount}%`;
  const styles = useStyles2(getStyles);
  const ref = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const { logsMap } = useTimepointExplorerContext();
  const statefulTimepoint = logsMap[timepoint.adjustedTime];

  useLayoutEffect(() => {
    setContainer(ref.current);
  }, [ref.current?.clientWidth]);

  if (!statefulTimepoint) {
    return <div style={{ width, height: '100%', backgroundColor: 'red' }} />;
  }

  return (
    <div key={timepoint.adjustedTime} className={styles.reachabilityTimepoint} style={{ width }} ref={ref}>
      {statefulTimepoint.executions.map((execution) => {
        const probeSuccess = execution.execution[LokiFieldNames.Labels].probe_success;
        const probeDuration = Number(execution.execution[LokiFieldNames.Labels].duration_seconds) * 1000;
        const probeName = execution.probe;
        const bottom = getEntryHeight(probeDuration, maxProbeDuration) / 100;
        const containerHeight = container?.clientHeight ?? 0;
        const containerWidth = container?.clientWidth ?? 0;
        // the probe is half the container width (--size) and the center is half of that
        // so the offset is 1/4 of the container width
        const offset = containerWidth / 4;

        const bottomInPx = containerHeight * bottom - offset;
        const actualPosition = bottomInPx + offset > containerHeight ? containerHeight - offset : bottomInPx;
        const selected =
          selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime && selectedTimepoint[1] === probeName;

        return (
          <div
            key={probeName}
            className={cx(styles.reachabilityProbe, {
              [styles.success]: probeSuccess === '1',
              [styles.failure]: probeSuccess === '0',
              [styles.selected]: selected,
            })}
            style={{ bottom: `${actualPosition}px` }}
          />
        );
      })}
    </div>
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

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
  `,
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
    background-color: ${theme.colors.background.primary};
  `,
  reachabilityTimepoint: css`
    position: relative;
    height: 100%;
    display: flex;
    justify-content: center;
  `,
  success: css`
    background-color: ${theme.colors.success.shade};
  `,
  failure: css`
    background-color: ${theme.colors.error.shade};
  `,
  selected: css`
    background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
    z-index: 1;
  `,
  reachabilityProbe: css`
    --size: 50%;
    width: var(--size);
    background-color: ${theme.colors.background.primary};
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
