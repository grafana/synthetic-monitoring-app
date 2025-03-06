import { useMemo } from 'react';
import { groupLogs } from 'features/parseCheckLogs/groupLogs';

import { Timeseries } from 'page/CheckDrilldown/checkDrilldown.types';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckLogs } from 'page/CheckDrilldown/hooks/useCheckLogs';
import { useCheckProbeDuration } from 'page/CheckDrilldown/hooks/useCheckProbeDuration';
import { useCheckProbeSuccess } from 'page/CheckDrilldown/hooks/useCheckProbeSuccess';
import { useCheckUptime } from 'page/CheckDrilldown/hooks/useCheckUptime';
import { constructTimepoints } from 'page/CheckDrilldown/utils/constructTimepoints';

export function useCheckDrilldownInfo() {
  const { timeRange } = useTimeRange();
  const { check } = useCheckDrilldown();

  const uptimeQuery = useCheckUptime({ check, timeRange });
  const logsQuery = useCheckLogs({ check, timeRange });
  const probeDurationQuery = useCheckProbeDuration({ check, timeRange });
  const probeSuccessQuery = useCheckProbeSuccess({ check, timeRange });

  const isLoading = uptimeQuery.isLoading || logsQuery.isLoading || probeDurationQuery.isLoading;
  const isError = uptimeQuery.isError || logsQuery.isError || probeDurationQuery.isError;
  const uptime = uptimeQuery.data;
  const logs = logsQuery.data;
  const perCheckLogs = useMemo(() => groupLogs(logs || []), [logs]);

  const probeDuration = probeDurationQuery.data;
  const probeSuccess = probeSuccessQuery.data;

  const timeseries: Timeseries = useMemo(
    () => ({
      uptime: uptime ? uptime.Uptime : [],
      probeDuration: probeDuration ? probeDuration : {},
      probeSuccess: probeSuccess ? probeSuccess : {},
    }),
    [uptime, probeDuration, probeSuccess]
  );

  const timePoints = useMemo(
    () => constructTimepoints({ check, timeRange, timeseries, perCheckLogs }),
    [check, timeRange, timeseries, perCheckLogs]
  );

  const drilldownInfo = useMemo(() => {
    return {
      singleStats: {
        uptime: uptime ? convertToPercentage(getMean(uptime.Uptime)) : null,
        duration: probeDuration ? getMean(probesCombined(probeDuration)) : null,
        probesWithResults: probeDuration ? Object.keys(probeDuration).length : null,
      },
      timeseries,
      logs: {
        raw: logs,
        perCheckLogs,
      },
      timePoints,
      isError,
      isLoading,
    };
  }, [timeseries, uptime, probeDuration, logs, perCheckLogs, timePoints, isError, isLoading]);

  return drilldownInfo;
}

function probesCombined(duration: Record<string, Array<[number, number]>>) {
  const probes = Object.values(duration);

  return probes.flat();
}

function getMean(values: Array<[number, number]>) {
  const reduced = values.reduce((acc, [_, value]) => {
    return acc + value;
  }, 0);

  return reduced / values.length;
}

function convertToPercentage(value: number) {
  return (value * 100).toFixed(2);
}
