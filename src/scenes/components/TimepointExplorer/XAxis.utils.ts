import { TimeRange } from '@grafana/data';

import { TIMEPOINT_LIST_ID, TIMEPOINT_SIZE } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { MinimapSection } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function calculatePositions(activeSection: MinimapSection) {
  const visibleTimepointsInDom = document.getElementById(TIMEPOINT_LIST_ID);

  if (!visibleTimepointsInDom) {
    return [];
  }

  const timepointListCoords = visibleTimepointsInDom.getBoundingClientRect();
  const timepoints = visibleTimepointsInDom.children;

  if (timepoints.length === 0) {
    return [];
  }

  const firstTimepointCoords = timepoints[0].getBoundingClientRect();
  const lastTimepointCoords = timepoints[timepoints.length - 1].getBoundingClientRect();

  // Calculate positions relative to the container
  const start = firstTimepointCoords.left - timepointListCoords.left + TIMEPOINT_SIZE / 2;
  const end = lastTimepointCoords.right - timepointListCoords.left - TIMEPOINT_SIZE / 2;

  if (timepoints.length === 1) {
    return [{ position: start, label: activeSection.from }];
  }

  // const spaceBetweenRange = end - start;

  return [
    { position: start, label: activeSection.from },
    { position: end, label: activeSection.to },
  ];
}

export function doesTimeRangeCrossDays(timeRange: TimeRange) {
  const from = new Date(timeRange.from.valueOf());
  const to = new Date(timeRange.to.valueOf());

  return from.getDate() !== to.getDate();
}
