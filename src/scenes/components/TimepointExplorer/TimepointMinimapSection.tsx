import React, { useLayoutEffect, useRef, useState } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import {
  Annotation,
  MinimapSection,
  SelectedTimepointState,
  Timepoint,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface MiniMapSectionProps {
  activeMiniMapSectionIndex: number;
  annotations: Annotation[];
  index: number;
  maxProbeDuration: number;
  section: MinimapSection;
  timepoints: Timepoint[];
  handleSectionClick: (index: number) => void;
  viewMode: ViewMode;
  timepointsToDisplay: number;
  selectedTimepoint: SelectedTimepointState;
  sectionWidth: number;
}

export const TimepointMiniMapSection = ({
  activeMiniMapSectionIndex,
  annotations,
  handleSectionClick,
  index,
  maxProbeDuration,
  section,
  selectedTimepoint,
  timepoints,
  timepointsToDisplay,
  viewMode,
}: MiniMapSectionProps) => {
  const styles = useStyles2(getStyles);
  const timepointsToRender = timepoints.slice(section.fromIndex, section.toIndex).reverse();
  const ref = useRef<HTMLButtonElement>(null);
  const from = new Date(section.from);
  const to = new Date(section.to);
  const fromFormatted = dateTimeFormat(from);
  const toFormatted = dateTimeFormat(to);
  const label = `${fromFormatted} to ${toFormatted}`;
  const isActive = activeMiniMapSectionIndex === index;

  return (
    <div className={styles.container}>
      <Tooltip content={label} ref={ref}>
        <button
          aria-label={label}
          className={cx(styles.section, { [styles.active]: isActive })}
          onClick={() => handleSectionClick(index)}
          ref={ref}
        >
          <MinimapSectionAnnotations
            annotations={annotations}
            timepointsInRange={timepointsToRender}
            timepointsToDisplay={timepointsToDisplay}
          />
          {viewMode === 'uptime' ? (
            <UptimeSection
              timepoints={timepointsToRender}
              maxProbeDuration={maxProbeDuration}
              timepointsToDisplay={timepointsToDisplay}
              selectedTimepoint={selectedTimepoint}
            />
          ) : (
            <ReachabilitySection
              timepoints={timepointsToRender}
              maxProbeDuration={maxProbeDuration}
              timepointsToDisplay={timepointsToDisplay}
              selectedTimepoint={selectedTimepoint}
            />
          )}
        </button>
      </Tooltip>
    </div>
  );
};

interface SectionChildProps {
  timepoints: Timepoint[];
  maxProbeDuration: number;
  timepointsToDisplay: number;
  selectedTimepoint: SelectedTimepointState;
}

const UptimeSection = ({ timepoints, maxProbeDuration, timepointsToDisplay, selectedTimepoint }: SectionChildProps) => {
  const styles = useStyles2(getStyles);
  const width = `${100 / timepointsToDisplay}%`;

  return timepoints.map((timepoint) => {
    const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDuration);

    return (
      <div
        key={timepoint.adjustedTime}
        className={cx(styles.uptimeTimepoint, {
          [styles.success]: timepoint.uptimeValue === 1,
          [styles.failure]: timepoint.uptimeValue === 0,
          [styles.selected]: selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime,
        })}
        style={{ height: `${height}%`, width }}
      />
    );
  });
};

const ReachabilitySection = ({
  timepoints,
  maxProbeDuration,
  timepointsToDisplay,
  selectedTimepoint,
}: SectionChildProps) => {
  const width = `${100 / timepointsToDisplay}%`;

  return timepoints.map((timepoint) => {
    return (
      <ReachabilityTimepoint
        key={timepoint.adjustedTime}
        timepoint={timepoint}
        maxProbeDuration={maxProbeDuration}
        width={width}
        selectedTimepoint={selectedTimepoint}
      />
    );
  });
};

interface ReachabilityTimepointProps {
  timepoint: Timepoint;
  maxProbeDuration: number;
  width: string;
  selectedTimepoint: SelectedTimepointState;
}

const ReachabilityTimepoint = ({
  timepoint,
  maxProbeDuration,
  width,
  selectedTimepoint,
}: ReachabilityTimepointProps) => {
  const styles = useStyles2(getStyles);
  const ref = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    setContainer(ref.current);
  }, [ref.current?.clientWidth]);

  return (
    <div key={timepoint.adjustedTime} className={styles.reachabilityTimepoint} style={{ width }} ref={ref}>
      {timepoint.probes.map((probe) => {
        const probeSuccess = probe[LokiFieldNames.Labels].probe_success;
        const probeDuration = Number(probe[LokiFieldNames.Labels].duration_seconds) * 1000;
        const probeName = probe[LokiFieldNames.Labels].probe;
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

const MinimapSectionAnnotations = ({
  annotations,
  timepointsInRange,
  timepointsToDisplay,
}: {
  annotations: Annotation[];
  timepointsInRange: Timepoint[];
  timepointsToDisplay: number;
}) => {
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
        const right = (100 / timepointsToDisplay) * timepointEndIndex;

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
    height: 40px;
    align-items: end;
    background-color: transparent;
    justify-content: end;
    position: relative;

    &:hover {
      background-color: ${theme.colors.background.secondary};
    }
  `,
  active: css`
    outline: 2px solid blue !important;
    z-index: 1;
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
