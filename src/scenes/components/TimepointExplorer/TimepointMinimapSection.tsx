import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import {
  MinimapSection,
  SelectedTimepointState,
  Timepoint,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface MiniMapSectionProps {
  maxProbeDurationData: number;
  section: MinimapSection;
  timepoints: Timepoint[];
  handleSectionClick: (section: MinimapSection) => void;
  viewMode: ViewMode;
  timepointDisplayCount: number;
  selectedTimepoint: SelectedTimepointState;
}

export const TimepointMiniMapSection = ({
  maxProbeDurationData,
  section,
  timepoints,
  handleSectionClick,
  viewMode,
  timepointDisplayCount,
  selectedTimepoint,
}: MiniMapSectionProps) => {
  const styles = getStyles(useTheme2());
  const timepointsToRender = timepoints.slice(section.fromIndex, section.toIndex).reverse();

  return (
    <button
      aria-label={`${new Date(section.from).toLocaleTimeString()} - ${new Date(section.to).toLocaleTimeString()}`}
      className={cx(styles.section, { [styles.active]: section.active })}
      onClick={() => handleSectionClick(section)}
    >
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
  const styles = getStyles(useTheme2());
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
  const styles = getStyles(useTheme2());
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

const getStyles = (theme: GrafanaTheme2) => ({
  section: css`
    width: 100%;
    padding: 0;
    border: none;
    display: flex;
    height: 40px;
    align-items: end;
    background-color: transparent;
    justify-content: end;
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
