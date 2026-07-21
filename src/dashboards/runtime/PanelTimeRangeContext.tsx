import React, { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { dateTime, TimeRange } from '@grafana/data';

import { useAppTimeOptional } from 'contexts/AppTimeProvider';

type PanelTimeRangeContextValue = {
  timeRange: TimeRange;
};

const PanelTimeRangeContext = createContext<PanelTimeRangeContextValue | null>(null);

export function PanelTimeRangeFromAppTime({ children }: PropsWithChildren) {
  const appTime = useAppTimeOptional();

  if (!appTime) {
    throw new Error('PanelTimeRangeFromAppTime requires AppTimeProvider');
  }

  const timeRange = useMemo<TimeRange>(
    () => ({
      from: dateTime(appTime.absolute.from),
      to: dateTime(appTime.absolute.to),
      raw: appTime.raw,
    }),
    [appTime]
  );

  return <PanelTimeRangeContext.Provider value={{ timeRange }}>{children}</PanelTimeRangeContext.Provider>;
}

export function PanelTimeRangeProvider({
  timeRange,
  children,
}: PropsWithChildren<{ timeRange: TimeRange }>) {
  return <PanelTimeRangeContext.Provider value={{ timeRange }}>{children}</PanelTimeRangeContext.Provider>;
}

export function usePanelTimeRange(): TimeRange {
  const context = useContext(PanelTimeRangeContext);

  if (!context) {
    throw new Error('usePanelTimeRange must be used within a PanelTimeRange provider');
  }

  return context.timeRange;
}

export function usePanelTimeRangeOptional(): TimeRange | null {
  return useContext(PanelTimeRangeContext)?.timeRange ?? null;
}
