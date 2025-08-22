import { dateTimeFormat } from '@grafana/data';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function getLabel(timepoints: StatelessTimepoint[]) {
  const firstTimepoint = timepoints[0];
  const lastTimepoint = timepoints[timepoints.length - 1];

  if (!firstTimepoint || !lastTimepoint) {
    return ``;
  }

  const from = new Date(firstTimepoint.adjustedTime);
  const to = new Date(lastTimepoint.adjustedTime);
  const fromFormatted = dateTimeFormat(from, { format: 'yyyy/MM/DD HH:mm:ss' });
  const toFormatted = dateTimeFormat(to, { format: 'yyyy/MM/DD HH:mm:ss' });

  return `${fromFormatted} to ${toFormatted}`;
}
