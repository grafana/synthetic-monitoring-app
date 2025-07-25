import React, { useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

import {
  TIMEPOINT_GAP,
  TIMEPOINT_LIST_ID,
  TIMEPOINT_THEME_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointListAnnotations } from 'scenes/components/TimepointExplorer/TimepointListAnnotations';
import { TimepointListEntry } from 'scenes/components/TimepointExplorer/TimepointListEntry';
import { TimepointListVizLegend } from 'scenes/components/TimepointExplorer/TimepointListVizLegend';
import { XAxis } from 'scenes/components/TimepointExplorer/XAxis';
import { YAxis } from 'scenes/components/TimepointExplorer/YAxis';

interface TimepointListProps {
  timeRange: { from: UnixTimestamp; to: UnixTimestamp };
}

export const TimepointList = ({ timeRange }: TimepointListProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const {
    handleWidthChange,
    maxProbeDuration,
    timepoints,
    width,
    miniMapCurrentPageSections,
    miniMapCurrentSectionIndex,
  } = useTimepointExplorerContext();
  const [fromIndex, toIndex] = miniMapCurrentPageSections[miniMapCurrentSectionIndex] || [0, 0];
  const styles = useStyles2(getStyles);

  const timepointsInRange = timepoints.slice(fromIndex, toIndex + 1);

  const onResize = useDebounceCallback((width: number) => {
    handleWidthChange(width);
  }, 100);

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref,
    onResize: () => {
      onResize(ref.current?.clientWidth ?? 0);
    },
  });

  return (
    <div>
      <div className={styles.container}>
        <YAxis maxProbeDuration={maxProbeDuration} width={width} />
        <div className={styles.timepointsContainer}>
          <TimepointListAnnotations timepointsInRange={timepointsInRange} />
          <div ref={ref} className={styles.timepoints} id={TIMEPOINT_LIST_ID}>
            {timepointsInRange.map((timepoint, index) => {
              return <TimepointListEntry key={index} timepoint={timepoint} viewIndex={index} />;
            })}
          </div>
        </div>
      </div>
      <XAxis timeRange={timeRange} timepoints={timepointsInRange} width={width} />
      <TimepointListVizLegend />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    position: relative;
    z-index: 1;
  `,
  timepoints: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(TIMEPOINT_GAP)};
    align-items: end;
    height: ${theme.spacing(TIMEPOINT_THEME_HEIGHT)};
    justify-content: end;
    position: relative;
  `,
  timepointsContainer: css`
    position: relative;
    flex: 1;
    overflow: hidden;
    padding-top: ${theme.spacing(3)};
  `,
  gridMarkers: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  `,
});
