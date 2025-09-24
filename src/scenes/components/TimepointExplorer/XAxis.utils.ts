import { dateTimeFormat } from '@grafana/data';

import { TIMEPOINT_GAP_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

const APPROXIMATE_SPACING = 200; // Approximate spacing in pixels

interface BuildXAxisPointsProps {
  timepoints: StatelessTimepoint[];
  crossesDays: boolean;
  timepointWidth: number;
  renderingStrategy: 'start' | 'end';
}

export function buildXAxisPoints({
  timepoints,
  crossesDays,
  timepointWidth,
  renderingStrategy,
}: BuildXAxisPointsProps) {
  const timepointCount = timepoints.length;

  if (timepointCount === 0) {
    return [];
  }

  const TIMEPOINT_WIDTH = timepointWidth + TIMEPOINT_GAP_PX;
  const LABEL_PER_POINTS = Math.floor(APPROXIMATE_SPACING / TIMEPOINT_WIDTH);
  // Calculate how many points we can fit based on approximate spacing
  const maxPoints = Math.max(1, Math.floor(timepointCount / LABEL_PER_POINTS) + 1);

  // Determine actual number of points to display (never more than available timepoints)
  const pointsToDisplay = Math.min(maxPoints, timepointCount);

  const build = [];

  // If we only have 1 timepoint or only need 1 point, just show the first
  if (pointsToDisplay === 1 || timepointCount === 1) {
    const firstTimepoint = timepoints[0];

    build.push({
      label: firstTimepoint.adjustedTime,
      index: renderingStrategy === 'end' ? timepointCount - 1 : 0, // Reversed index
    });
  }
  // If we need 2 points, show first and last
  else if (pointsToDisplay === 2) {
    // First point
    const firstTimepoint = timepoints[0];

    build.push({
      label: firstTimepoint.adjustedTime,
      index: renderingStrategy === 'end' ? timepointCount - 1 : 0, // Reversed index
    });

    // Last point
    const lastTimepoint = timepoints[timepointCount - 1];

    build.push({
      label: lastTimepoint.adjustedTime,
      index: renderingStrategy === 'end' ? 0 : timepointCount - 1, // Reversed index
    });
  } else {
    // Calculate evenly spaced indices
    const step = (timepointCount - 1) / (pointsToDisplay - 1);

    for (let i = 0; i < pointsToDisplay; i++) {
      const index = Math.round(i * step);
      const timepoint = timepoints[index];

      build.push({
        label: timepoint.adjustedTime,
        index: renderingStrategy === 'end' ? timepointCount - 1 - index : index, // Reversed index for rendering
      });
    }
  }

  return build.map((point) => {
    const date = new Date(point.label);
    const label = dateTimeFormat(date, {
      format: crossesDays ? 'M/D, HH:mm:ss' : 'HH:mm:ss',
    });

    return {
      ...point,
      label,
    };
  });
}

export function doesTimeRangeCrossDays(from: Date, to: Date) {
  return (
    from.getDate() !== to.getDate() || from.getMonth() !== to.getMonth() || from.getFullYear() !== to.getFullYear()
  );
}
