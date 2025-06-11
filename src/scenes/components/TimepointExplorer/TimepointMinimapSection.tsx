import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
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
  annotations: Annotation[];
  maxProbeDurationData: number;
  section: MinimapSection;
  timepoints: Timepoint[];
  handleSectionClick: (section: MinimapSection) => void;
  viewMode: ViewMode;
  timepointDisplayCount: number;
  selectedTimepoint: SelectedTimepointState;
  sectionWidth: number;
}

export const TimepointMiniMapSection = ({
  annotations,
  maxProbeDurationData,
  section,
  timepoints,
  handleSectionClick,
  viewMode,
  timepointDisplayCount,
  selectedTimepoint,
}: MiniMapSectionProps) => {
  const styles = useStyles2(getStyles);
  const timepointsToRender = timepoints.slice(section.fromIndex, section.toIndex).reverse();

  return (
    <div className={styles.container}>
      <button
        aria-label={`${new Date(section.from).toLocaleTimeString()} - ${new Date(section.to).toLocaleTimeString()}`}
        className={cx(styles.section, { [styles.active]: section.active })}
        onClick={() => handleSectionClick(section)}
      >
        <MinimapSectionAnnotations
          annotations={annotations}
          timepointsInRange={timepointsToRender}
          timepointDisplayCount={timepointDisplayCount}
        />
        {viewMode === 'uptime' ? (
          <UptimeSection
            timepoints={timepointsToRender}
            maxProbeDurationData={maxProbeDurationData}
            timepointDisplayCount={timepointDisplayCount}
            selectedTimepoint={selectedTimepoint}
          />
        ) : (
          <ReachabilitySection
            timepoints={timepointsToRender}
            maxProbeDurationData={maxProbeDurationData}
            timepointDisplayCount={timepointDisplayCount}
            selectedTimepoint={selectedTimepoint}
          />
        )}
      </button>
    </div>
  );
};

interface SectionChildProps {
  timepoints: Timepoint[];
  maxProbeDurationData: number;
  timepointDisplayCount: number;
  selectedTimepoint: SelectedTimepointState;
}

const UptimeSection = ({
  timepoints,
  maxProbeDurationData,
  timepointDisplayCount,
  selectedTimepoint,
}: SectionChildProps) => {
  const styles = useStyles2(getStyles);
  const width = `${100 / timepointDisplayCount}%`;

  return timepoints.map((timepoint) => {
    const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);

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
  maxProbeDurationData,
  timepointDisplayCount,
  selectedTimepoint,
}: SectionChildProps) => {
  const width = `${100 / timepointDisplayCount}%`;

  return timepoints.map((timepoint) => {
    return (
      <ReachabilityTimepoint
        key={timepoint.adjustedTime}
        timepoint={timepoint}
        maxProbeDurationData={maxProbeDurationData}
        width={width}
        selectedTimepoint={selectedTimepoint}
      />
    );
  });
};

interface ReachabilityTimepointProps {
  timepoint: Timepoint;
  maxProbeDurationData: number;
  width: string;
  selectedTimepoint: SelectedTimepointState;
}

const ReachabilityTimepoint = ({
  timepoint,
  maxProbeDurationData,
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
        const bottom = getEntryHeight(probeDuration, maxProbeDurationData) / 100;
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
  timepointDisplayCount,
}: {
  annotations: Annotation[];
  timepointsInRange: Timepoint[];
  timepointDisplayCount: number;
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
        const right = (100 / timepointDisplayCount) * timepointEndIndex;

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
