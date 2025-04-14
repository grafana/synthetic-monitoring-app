import React from 'react';
import { TimeRange } from '@grafana/data';

interface TimepointListEntryProps {
  timeRange: TimeRange;
}

export const TimepointListEntry = ({ timeRange }: TimepointListEntryProps) => {
  return <div>Timepoint List Entry</div>;
};
