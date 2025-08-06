import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { OutOfTimeRangeAnnotation } from 'scenes/components/TimepointExplorer/OutOfTimeRangeAnnotation';
import { TIMEPOINT_LIST_ANNOTATIONS_ID } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { CheckEventType, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  getCheckEventsInRange,
  getClosestTimepointsToCheckEvent,
} from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';
import { TimepointInstantAnnotation } from 'scenes/components/TimepointExplorer/TimepointInstantAnnotation';
import { TimepointRangeAnnotation } from 'scenes/components/TimepointExplorer/TimepointRangeAnnotation';

interface TimepointExplorerAnnotationsProps {
  displayLabels?: boolean;
  displayWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

export const TimepointExplorerAnnotations = ({
  displayLabels,
  displayWidth,
  timepointsInRange,
}: TimepointExplorerAnnotationsProps) => {
  const { checkEvents } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);
  const checkEventsInRange = getCheckEventsInRange(checkEvents, timepointsInRange);
  const annotationsToRender = getClosestTimepointsToCheckEvent(checkEventsInRange, timepointsInRange);

  return (
    <div className={styles.container} id={TIMEPOINT_LIST_ANNOTATIONS_ID}>
      {annotationsToRender.map((annotation) => {
        const isInstant = annotation.visibleStartIndex === annotation.visibleEndIndex;

        if (annotation.label === CheckEventType.OUT_OF_TIMERANGE) {
          return (
            <OutOfTimeRangeAnnotation
              key={`${annotation.label}-${annotation.to}`}
              annotation={annotation}
              displayLabels={displayLabels}
              displayWidth={displayWidth}
              timepointsInRange={timepointsInRange}
            />
          );
        }

        if (isInstant) {
          return (
            <TimepointInstantAnnotation
              key={`${annotation.label}-${annotation.to}`}
              annotation={annotation}
              displayLabels={displayLabels}
              displayWidth={displayWidth}
              timepointsInRange={timepointsInRange}
            />
          );
        }

        return (
          <TimepointRangeAnnotation
            key={`${annotation.label}-${annotation.to}`}
            annotation={annotation}
            displayLabels={displayLabels}
            displayWidth={displayWidth}
            timepointsInRange={timepointsInRange}
          />
        );
      })}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
  `,
});
