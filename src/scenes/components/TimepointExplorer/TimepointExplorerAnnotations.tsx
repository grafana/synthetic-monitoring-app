import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useSceneAnnotation } from 'scenes/Common/useSceneAnnotation';
import { PreTimepointAnnotations } from 'scenes/components/TimepointExplorer/PreTimepointAnnotations';
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
  displayWidth: number;
  isBeginningSection: boolean;
  parentWidth: number;
  showLabels?: boolean;
  showTooltips?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

export const TimepointExplorerAnnotations = ({
  displayWidth,
  isBeginningSection,
  parentWidth,
  showLabels,
  showTooltips,
  timepointsInRange,
  triggerHeight,
}: TimepointExplorerAnnotationsProps) => {
  const { checkEvents } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);
  const alertsFiring = useSceneAnnotation('Alerts firing');
  const alertsPending = useSceneAnnotation('Alerts pending');

  const alertFiringEvents = alertsFiring.map(([timeStart, timeEnd]) => ({
    label: CheckEventType.ALERTS_FIRING,
    to: timeEnd,
    from: timeStart,
    color: 'red',
  }));

  const alertPendingEvents = alertsPending.map(([timeStart, timeEnd]) => ({
    label: CheckEventType.ALERTS_PENDING,
    to: timeEnd,
    from: timeStart,
    color: 'yellow',
  }));

  const checkEventsInRange = getCheckEventsInRange(
    [...checkEvents, ...alertFiringEvents, ...alertPendingEvents],
    timepointsInRange
  );
  const annotationsToRender = getClosestTimepointsToCheckEvent(checkEventsInRange, timepointsInRange);

  return (
    <div className={styles.container} id={TIMEPOINT_LIST_ANNOTATIONS_ID}>
      <PreTimepointAnnotations
        displayWidth={displayWidth}
        isBeginningSection={isBeginningSection}
        parentWidth={parentWidth}
        showLabels={showLabels}
        timepointsInRange={timepointsInRange}
        triggerHeight={triggerHeight}
      />

      {annotationsToRender.map((annotation) => {
        if (annotation.isInstant) {
          return (
            <TimepointInstantAnnotation
              key={`${annotation.checkEvent.label}-${annotation.checkEvent.to}`}
              annotation={annotation}
              displayWidth={displayWidth}
              parentWidth={parentWidth}
              showLabels={showLabels}
              timepointsInRange={timepointsInRange}
            />
          );
        }

        return (
          <TimepointRangeAnnotation
            key={`${annotation.checkEvent.label}-${annotation.checkEvent.to}`}
            annotation={annotation}
            displayWidth={displayWidth}
            parentWidth={parentWidth}
            showLabels={showLabels}
            showTooltips={showTooltips}
            timepointsInRange={timepointsInRange}
            triggerHeight={triggerHeight}
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
