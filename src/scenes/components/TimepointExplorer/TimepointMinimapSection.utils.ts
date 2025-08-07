import { dateTimeFormat } from '@grafana/data';

import { StatefulTimepoint, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function getLabel(timepoints: StatelessTimepoint[]) {
  const firstTimepoint = timepoints[0];
  const lastTimepoint = timepoints[timepoints.length - 1];

  if (!firstTimepoint || !lastTimepoint) {
    return ``;
  }

  const from = new Date(firstTimepoint.adjustedTime);
  const to = new Date(lastTimepoint.adjustedTime);
  const fromFormatted = dateTimeFormat(from);
  const toFormatted = dateTimeFormat(to);

  return `${fromFormatted} to ${toFormatted}`;
}

export function getState(statefulTimepoint: StatefulTimepoint) {
  if (statefulTimepoint.uptimeValue === 0) {
    return 'failure';
  }

  if (statefulTimepoint.uptimeValue === 1) {
    return 'success';
  }

  if (statefulTimepoint.uptimeValue === 2) {
    return 'pending';
  }

  return 'unknown';
}
