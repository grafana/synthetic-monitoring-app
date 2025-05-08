import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { MinimapSection, Timepoint, ViewMode } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface MiniMapSectionProps {
  maxProbeDurationData: number;
  section: MinimapSection;
  timepoints: Timepoint[];
  handleSectionClick: (section: MinimapSection) => void;
  viewMode: ViewMode;
  timepointDisplayCount: number;
}

export const TimepointMiniMapSection = ({
  maxProbeDurationData,
  section,
  timepoints,
  handleSectionClick,
  viewMode,
  timepointDisplayCount,
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
        />
      ) : (
        <ReachabilitySection
          timepoints={timepointsToRender}
          maxProbeDurationData={maxProbeDurationData}
          timepointDisplayCount={timepointDisplayCount}
        />
      )}
    </button>
  );
};

interface SectionChildProps {
  timepoints: Timepoint[];
  maxProbeDurationData: number;
  timepointDisplayCount: number;
}

const UptimeSection = ({ timepoints, maxProbeDurationData, timepointDisplayCount }: SectionChildProps) => {
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
        })}
        style={{ height: `${height}%`, width }}
      />
    );
  });
};

const ReachabilitySection = ({ timepoints, maxProbeDurationData, timepointDisplayCount }: SectionChildProps) => {
  const width = `${100 / timepointDisplayCount}%`;

  return timepoints.map((timepoint) => {
    return (
      <ReachabilityTimepoint
        key={timepoint.adjustedTime}
        timepoint={timepoint}
        maxProbeDurationData={maxProbeDurationData}
        width={width}
      />
    );
  });
};

interface ReachabilityTimepointProps {
  timepoint: Timepoint;
  maxProbeDurationData: number;
  width: string;
}

const ReachabilityTimepoint = ({ timepoint, maxProbeDurationData, width }: ReachabilityTimepointProps) => {
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
        const bottom = getEntryHeight(probeDuration, maxProbeDurationData) / 100;
        const containerHeight = container?.clientHeight ?? 0;
        const containerWidth = container?.clientWidth ?? 0;
        // the probe is half the container width (--size) and the center is half of that
        // so the offset is 1/4 of the container width
        const offset = containerWidth / 4;

        const bottomInPx = containerHeight * bottom - offset;
        const actualPosition = bottomInPx + offset > containerHeight ? containerHeight - offset : bottomInPx;

        return (
          <div
            key={probe[LokiFieldNames.Labels].probe}
            className={cx(styles.reachabilityProbe, {
              [styles.success]: probeSuccess === '1',
              [styles.failure]: probeSuccess === '0',
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
  reachabilityProbe: css`
    --size: 50%;
    width: var(--size);
    background-color: ${theme.colors.background.primary};
    padding-bottom: var(--size);
    position: absolute;
    border-radius: 50%;
  `,
});
