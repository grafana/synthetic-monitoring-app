import { useMemo } from 'react';
import { TimeRange } from '@grafana/data';

import { Timeseries } from 'page/CheckDrilldown/checkDrilldown.types';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { useCheckLogs } from 'page/CheckDrilldown/hooks/useCheckLogs';
import { useCheckProbeDuration } from 'page/CheckDrilldown/hooks/useCheckProbeDuration';
import { useCheckProbeSuccess } from 'page/CheckDrilldown/hooks/useCheckProbeSuccess';
import { useCheckUptime } from 'page/CheckDrilldown/hooks/useCheckUptime';
import { constructTimepoints } from 'page/CheckDrilldown/utils/constructTimepoints';

export function useTimepointExplorer(timeRange: TimeRange) {
  const { check } = useCheckDrilldown();

  const uptimeQuery = useCheckUptime({ check, timeRange });
  const logsQuery = useCheckLogs({ check, timeRange });
  const probeDurationQuery = useCheckProbeDuration({ check, timeRange });
  const probeSuccessQuery = useCheckProbeSuccess({ check, timeRange });

  const isLoading = uptimeQuery.isLoading || logsQuery.isLoading || probeDurationQuery.isLoading;
  const isError = uptimeQuery.isError || logsQuery.isError || probeDurationQuery.isError;
  const uptime = uptimeQuery.data;
  const logs = logsQuery.data;
  const perCheckLogs = useMemo(() => logs || [], [logs]);
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
      timeseries,
      logs: {
        perCheckLogs,
      },
      timePoints,
      isError,
      isLoading,
    };
  }, [timeseries, perCheckLogs, timePoints, isError, isLoading]);

  return drilldownInfo;
}
