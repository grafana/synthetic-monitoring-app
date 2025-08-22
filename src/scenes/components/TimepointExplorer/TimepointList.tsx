import React, { useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { LoadingBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

import {
  ANNOTATION_GRAPH_TRIGGER_HEIGHT_PX,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_LIST_ID,
  TIMEPOINT_THEME_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { TimepointExplorerAnnotations } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations';
import { TimepointListEntry } from 'scenes/components/TimepointExplorer/TimepointListEntry';
import { TimepointListErrorButton } from 'scenes/components/TimepointExplorer/TimepointListErrorButton';
import { TimepointListVizLegend } from 'scenes/components/TimepointExplorer/TimepointListVizLegend';
import { XAxis } from 'scenes/components/TimepointExplorer/XAxis';
import { YAxis } from 'scenes/components/TimepointExplorer/YAxis';

export const TimepointList = () => {
  const ref = useRef<HTMLDivElement>(null);

  const {
    handleListWidthChange,
    isError,
    isFetching,
    timepoints,
    listWidth,
    miniMapCurrentPageSections,
    miniMapCurrentSectionIndex,
    timepointWidth,
    yAxisMax,
  } = useTimepointExplorerContext();

  const currentSectionRange = miniMapCurrentPageSections[miniMapCurrentSectionIndex];
  const [fromIndex, toIndex] = miniMapCurrentPageSections[miniMapCurrentSectionIndex];
  const styles = useStyles2(getStyles);

  const timepointsInRange = timepoints.slice(fromIndex, toIndex + 1);

  const onResize = useDebounceCallback((width: number) => {
    handleListWidthChange(width, currentSectionRange);
  }, 100);

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref,
    onResize: () => {
      onResize(ref.current?.clientWidth ?? 0);
    },
  });

  const isBeginningSection = miniMapCurrentSectionIndex === miniMapCurrentPageSections.length - 1;

  return (
    <div>
      {isFetching ? <LoadingBar width={listWidth} /> : <div style={{ height: 1 }} />}
      <div className={styles.container}>
        {isError && (
          <div className={styles.error}>
            <TimepointListErrorButton />
          </div>
        )}
        <YAxis max={yAxisMax} width={listWidth} />
        <div className={styles.timepointsContainer}>
          <TimepointExplorerAnnotations
            displayWidth={timepointWidth + TIMEPOINT_GAP_PX}
            isBeginningSection={isBeginningSection}
            parentWidth={listWidth}
            showLabels
            showTooltips
            timepointsInRange={timepointsInRange}
            triggerHeight={ANNOTATION_GRAPH_TRIGGER_HEIGHT_PX}
          />
          <div ref={ref} className={styles.timepoints} id={TIMEPOINT_LIST_ID}>
            {timepointsInRange.map((timepoint, index) => {
              return <TimepointListEntry key={index} timepoint={timepoint} viewIndex={index} />;
            })}
          </div>
        </div>
      </div>
      <XAxis timepoints={timepointsInRange} />
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
  error: css`
    position: absolute;
    top: ${theme.spacing(2)};
    right: ${theme.spacing(2)};
    z-index: 1000;
  `,
  timepoints: css`
    display: flex;
    flex-direction: row;
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
    padding-bottom: ${ANNOTATION_GRAPH_TRIGGER_HEIGHT_PX}px;
  `,
  gridMarkers: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  `,
});
