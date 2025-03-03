import React, { createContext, PropsWithChildren, useContext, useState } from 'react';
import { dateTime, TimeRange } from '@grafana/data';

type TimeRangeContextValue = {
  timeRange: TimeRange;
  setTimeRange: (timeRange: TimeRange) => void;
  refreshInterval: string;
  setRefreshInterval: (refreshInterval: string) => void;
} | null;

const TimeRangeContext = createContext<TimeRangeContextValue>(null);

export const TimeRangeProvider = ({ children }: PropsWithChildren) => {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: dateTime(new Date().toISOString()),
    to: dateTime(new Date().toISOString()),
    raw: {
      from: `now-3h`,
      to: `now`,
    },
  });
  const [refreshInterval, setRefreshInterval] = useState<string>('5s');

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange, refreshInterval, setRefreshInterval }}>
      {children}
    </TimeRangeContext.Provider>
  );
};

export function useTimeRange() {
  const context = useContext(TimeRangeContext);

  if (!context) {
    throw new Error('useTimeRange must be used within a TimeRangeProvider');
  }

  return context;
}
