import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { dateTime, TimeRange } from '@grafana/data';

type TimeRangeContextValue = {
  timeRange: TimeRange;
  setTimeRange: (timeRange: TimeRange) => void;
  refreshInterval: string;
  setRefreshInterval: (refreshInterval: string) => void;
} | null;

const TimeRangeContext = createContext<TimeRangeContextValue>(null);

export const TimeRangeProvider = ({ children }: PropsWithChildren) => {
  const now = new Date().toISOString();
  const HOURS = 3;

  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: dateTime(now).subtract(HOURS, 'hours'),
    to: dateTime(now),
    raw: {
      from: `now-${HOURS}h`,
      to: `now`,
    },
  });
  const [refreshInterval, setRefreshInterval] = useState<string>('5s');

  const value = useMemo(
    () => ({ timeRange, setTimeRange, refreshInterval, setRefreshInterval }),
    [timeRange, refreshInterval]
  );

  return <TimeRangeContext.Provider value={value}>{children}</TimeRangeContext.Provider>;
};

export function useTimeRange() {
  const context = useContext(TimeRangeContext);

  if (!context) {
    throw new Error('useTimeRange must be used within a TimeRangeProvider');
  }

  return context;
}
