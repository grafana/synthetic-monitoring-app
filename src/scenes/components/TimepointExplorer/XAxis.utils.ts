import { getTimeZone } from '@grafana/data';

import { TIMEPOINT_GAP_PX, TIMEPOINT_SIZE } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { StatelessTimepoint, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

const APPROXIMATE_SPACING = 200; // Approximate spacing in pixels
const TIMEPOINT_WIDTH = TIMEPOINT_SIZE + TIMEPOINT_GAP_PX;
const LABEL_PER_POINTS = Math.floor(APPROXIMATE_SPACING / TIMEPOINT_WIDTH);

export function generateXAxisPoints(
  timepointsInRange: StatelessTimepoint[],
  timeRange: { from: UnixTimestamp; to: UnixTimestamp }
) {
  if (timepointsInRange.length === 0) {
    return [];
  }

  const crossesDays = doesTimeRangeCrossDays(timeRange);

  // Calculate how many points we can fit based on approximate spacing
  const maxPoints = Math.max(2, Math.floor(timepointsInRange.length / LABEL_PER_POINTS) + 1);

  // Determine actual number of points to display (never more than available timepoints)
  const pointsToDisplay = Math.min(maxPoints, timepointsInRange.length);

  const build = [];

  // If we only have room for 2 points or only have 1-2 timepoints, just show first and last
  if (pointsToDisplay <= 2 || timepointsInRange.length <= 2) {
    // First point
    const firstTimepoint = timepointsInRange[0];

    build.push({
      label: firstTimepoint.adjustedTime,
      index: timepointsInRange.length - 1, // Reversed index
    });

    // Last point (if different from first)
    if (timepointsInRange.length > 1) {
      const lastTimepoint = timepointsInRange[timepointsInRange.length - 1];

      build.push({
        label: lastTimepoint.adjustedTime,
        index: 0, // Reversed index
      });
    }
  } else {
    // Calculate evenly spaced indices
    const step = (timepointsInRange.length - 1) / (pointsToDisplay - 1);

    for (let i = 0; i < pointsToDisplay; i++) {
      const index = Math.round(i * step);
      const timepoint = timepointsInRange[index];

      build.push({
        label: timepoint.adjustedTime,
        index: timepointsInRange.length - 1 - index, // Reversed index for rendering
      });
    }
  }
  const timeZoneData = getTimeZone();
  const timeZone = timeZoneData === 'browser' ? undefined : timeZoneData;

  return build.map((point) => {
    const date = new Date(point.label);

    return {
      ...point,
      label: crossesDays
        ? date.toLocaleString(undefined, {
            timeZone,
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : date.toLocaleTimeString(undefined, {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
          }),
    };
  });
}

function doesTimeRangeCrossDays(timeRange: { from: UnixTimestamp; to: UnixTimestamp }) {
  const from = new Date(timeRange.from);
  const to = new Date(timeRange.to);

  return from.getDate() !== to.getDate();
}
