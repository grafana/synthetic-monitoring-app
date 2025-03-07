import { useMemo } from 'react';

import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckMaxDuration } from 'page/CheckDrilldown/hooks/useCheckMaxDuration';
import { useCheckProbeDuration } from 'page/CheckDrilldown/hooks/useCheckProbeDuration';
import { useCheckReachability } from 'page/CheckDrilldown/hooks/useCheckReachability';
import { useCheckUptime } from 'page/CheckDrilldown/hooks/useCheckUptime';
import { calculateTimePointsInTimeRange } from 'page/CheckDrilldown/utils/constructTimepoints';

export function useCheckDrilldownInfo() {
  const { timeRange } = useTimeRange();
  const { check } = useCheckDrilldown();

  const uptimeQuery = useCheckUptime({ check, timeRange });
  const reachabilityQuery = useCheckReachability({ check, timeRange });
  const probeDurationQuery = useCheckProbeDuration({ check, timeRange });
  const maxDurationQuery = useCheckMaxDuration({ check, timeRange });
  const timePointsInRange = useMemo(
    () =>
      calculateTimePointsInTimeRange({
        from: timeRange.from.valueOf(),
        to: timeRange.to.valueOf(),
        frequency: check.frequency,
      }),
    [timeRange, check.frequency]
  );

  const isLoading =
    uptimeQuery.isLoading || probeDurationQuery.isLoading || maxDurationQuery.isLoading || reachabilityQuery.isLoading;
  const isError =
    uptimeQuery.isError || probeDurationQuery.isError || maxDurationQuery.isError || reachabilityQuery.isError;
  const uptime = uptimeQuery.data;
  const maxDuration = maxDurationQuery.data;
  const reachability = reachabilityQuery.data;
  const probeDuration = probeDurationQuery.data;

  const drilldownInfo = useMemo(() => {
    return {
      timePointsInRange,
      uptime: uptime?.Uptime || null,
      reachability: reachability?.Reachability || null,
      duration: probeDuration || null,
      maxDuration: maxDuration || null,
      isError,
      isLoading,
    };
  }, [uptime, probeDuration, isError, isLoading, timePointsInRange, maxDuration, reachability]);

  return drilldownInfo;
}
