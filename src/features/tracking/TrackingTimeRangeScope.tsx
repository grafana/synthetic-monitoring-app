import { TimeRange } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { useTrackingScope } from 'features/tracking/useTrackingScope';

/**
 * Attaches the current dashboard time range to every tracking event fired while
 * mounted. Must be rendered inside a `SceneContextProvider`. Renders nothing.
 */
export const TrackingTimeRangeScope = () => {
  const [timeRange] = useTimeRange();

  useTrackingScope({
    time_range_from: toPrimitive(timeRange.raw.from),
    time_range_to: toPrimitive(timeRange.raw.to),
    time_range_seconds: Math.round((timeRange.to.valueOf() - timeRange.from.valueOf()) / 1000),
  });

  return null;
};

// tracking props only allow primitives, so DateTime raw values (absolute ranges) report as ISO strings
function toPrimitive(rawValue: TimeRange['raw']['from']): string {
  return typeof rawValue === 'string' ? rawValue : rawValue.toISOString();
}
