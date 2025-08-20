import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { ExecutionEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { PlainButton } from 'components/PlainButton';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import {
  MAX_MINIMAP_SECTIONS,
  MINIMAP_SECTION_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  MiniMapSection,
  StatefulTimepoint,
  StatelessTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  getCouldBePending,
  getEntryHeight,
  getIsInTheFuture,
  getPendingProbeNames,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointExplorerAnnotations } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations';
import { getLabel } from 'scenes/components/TimepointExplorer/TimepointMinimapSection.utils';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

interface MiniMapSectionProps {
  index: number;
  miniMapWidth: number;
  section: MiniMapSection;
}

export const TimepointMiniMapSection = ({ index, miniMapWidth, section }: MiniMapSectionProps) => {
  const {
    handleMiniMapSectionChange,
    miniMapCurrentSectionIndex,
    miniMapCurrentPageSections,
    timepointsDisplayCount,
    timepoints,
    timepointWidth,
  } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const [start, end] = section;
  const miniMapSectionTimepoints = timepoints.slice(start, end + 1);
  const ref = useRef<HTMLButtonElement>(null);
  const label = getLabel(miniMapSectionTimepoints);
  const isActive = miniMapCurrentSectionIndex === index;
  const sectionWidth = miniMapWidth / MAX_MINIMAP_SECTIONS;
  const entryWidth = sectionWidth / timepointsDisplayCount;
  const isBeginningSection = index === miniMapCurrentPageSections.length - 1;

  return (
    <Tooltip content={label} ref={ref}>
      <PlainButton
        aria-label={label}
        className={cx(styles.section, { [styles.active]: isActive })}
        onClick={() => handleMiniMapSectionChange(index)}
        ref={ref}
      >
        <TimepointExplorerAnnotations
          displayWidth={entryWidth}
          isBeginningSection={isBeginningSection}
          parentWidth={sectionWidth}
          showTooltips={false}
          timepointsInRange={miniMapSectionTimepoints}
          triggerHeight={2}
        />
        {miniMapSectionTimepoints.map((timepoint) => {
          return <Entry key={timepoint.adjustedTime} timepoint={timepoint} parentWidth={sectionWidth} />;
        })}
      </PlainButton>
    </Tooltip>
  );
};

const Entry = ({ timepoint, parentWidth }: { timepoint: StatelessTimepoint; parentWidth: number }) => {
  const { check, currentAdjustedTime, isLoading, timepointsDisplayCount, viewMode } = useTimepointExplorerContext();
  const selectedProbeNames = useSceneVarProbes(check);
  const isInTheFuture = getIsInTheFuture(timepoint, currentAdjustedTime);
  const couldBePending = getCouldBePending(timepoint, currentAdjustedTime);
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const pendingProbeNames = getPendingProbeNames({ statefulTimepoint, selectedProbeNames });
  const width = parentWidth / timepointsDisplayCount;
  const isEntryLoading = isLoading && statefulTimepoint.status === 'missing';

  if (timepoint.config.type === 'no-data' || isInTheFuture || isEntryLoading) {
    return <div key={timepoint.adjustedTime} style={{ width }} />;
  }

  if (couldBePending && pendingProbeNames.length) {
    return <PendingTimepoint key={timepoint.adjustedTime} statefulTimepoint={statefulTimepoint} width={width} />;
  }

  if (viewMode === 'uptime') {
    return <UptimeTimepoint key={timepoint.adjustedTime} statefulTimepoint={statefulTimepoint} width={width} />;
  }

  return <ReachabilityTimepoint key={timepoint.adjustedTime} statefulTimepoint={statefulTimepoint} width={width} />;
};

interface EntryProps {
  statefulTimepoint: StatefulTimepoint;
  width: number;
}

const PendingTimepoint = ({ statefulTimepoint, width }: EntryProps) => {
  const { maxProbeDuration, selectedState, vizDisplay } = useTimepointExplorerContext();
  const { status } = statefulTimepoint;
  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const [selectedTimepoint] = selectedState;

  if (!vizDisplay.includes(status)) {
    return <div style={{ width }} />;
  }

  return (
    <TimepointVizItem
      key={statefulTimepoint.adjustedTime}
      className={cx(styles.uptimeTimepoint, {
        [styles.selected]: selectedTimepoint?.adjustedTime === statefulTimepoint.adjustedTime,
      })}
      data-testid={`pending-timepoint-${statefulTimepoint.index}`}
      status={`pending`}
      style={{ height: `${height}%`, width }}
    />
  );
};

const UptimeTimepoint = ({ statefulTimepoint, width }: EntryProps) => {
  const { maxProbeDuration, selectedState, vizDisplay } = useTimepointExplorerContext();
  const { status } = statefulTimepoint;
  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const [selectedTimepoint] = selectedState;

  if (!vizDisplay.includes(status)) {
    return <div style={{ width }} />;
  }

  return (
    <TimepointVizItem
      key={statefulTimepoint.adjustedTime}
      className={cx(styles.uptimeTimepoint, {
        [styles.selected]: selectedTimepoint?.adjustedTime === statefulTimepoint.adjustedTime,
      })}
      data-testid={`uptime-timepoint-${statefulTimepoint.index}`}
      status={status}
      style={{ height: `${height}%`, width }}
    />
  );
};

const ReachabilityTimepoint = ({ statefulTimepoint, width }: EntryProps) => {
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const ref = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const executions = Object.values(statefulTimepoint.probeResults).flat();

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
      key={statefulTimepoint.adjustedTime}
      className={styles.reachabilityTimepoint}
      style={{ width }}
      ref={ref}
      data-testid={`reachability-timepoint-${statefulTimepoint.index}`}
    >
      {executions.map((execution) => {
        return (
          <ExecutionEntry
            containerHeight={containerHeight}
            offset={offset}
            execution={execution}
            key={execution.id}
            timepoint={statefulTimepoint}
            width={width}
          />
        );
      })}
    </div>
  );
};

interface ExecutionEntryProps {
  containerHeight: number;
  offset: number;
  execution: ExecutionEndedLog;
  timepoint: StatelessTimepoint;
  width: number;
}

const ExecutionEntry = ({ containerHeight, offset, execution, timepoint, width }: ExecutionEntryProps) => {
  const { maxProbeDuration, selectedState, timepointWidth, vizDisplay } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);
  const probeSuccess = execution[LokiFieldNames.Labels].probe_success;
  const probeDuration = Number(execution[LokiFieldNames.Labels].duration_seconds) * 1000;
  const probeName = execution.labels.probe;
  const bottom = getEntryHeight(probeDuration, maxProbeDuration) / 100;
  const [timepointToView, probeNameToView] = selectedState;

  const bottomInPx = containerHeight * bottom - offset;
  const actualPosition = bottomInPx + offset > containerHeight ? containerHeight - offset : bottomInPx;
  const selected = timepointToView?.adjustedTime === timepoint.adjustedTime && probeNameToView === probeName;
  const status = probeSuccess === '1' ? 'success' : probeSuccess === '0' ? 'failure' : 'missing';

  if (!vizDisplay.includes(status)) {
    return <div />;
  }

  const size = Math.max(width * 0.75, 1);

  return (
    <TimepointVizItem
      key={probeName}
      className={cx(styles.reachabilityProbe, {
        [styles.selected]: selected,
      })}
      status={status}
      style={{ bottom: `${actualPosition}px`, width: size, height: size }}
    />
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number) => ({
  section: css`
    width: 100%;
    padding: 0;
    border: none;
    display: flex;
    height: ${MINIMAP_SECTION_HEIGHT}px;
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
    background-color: ${theme.colors.warning.border};
    border-color: ${theme.colors.warning.border};
    z-index: 1;
  `,
  reachabilityProbe: css`
    position: absolute;
    border-radius: 50%;
  `,
});
