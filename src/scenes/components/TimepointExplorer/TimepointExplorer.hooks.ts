import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeRange } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { useTheme2 } from '@grafana/ui';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';
import { getCheckProbeMaxDuration } from 'queries/getCheckProbeMaxDuration';

import { EndingLogLabels, ExecutionLabels, ExecutionLabelType } from 'features/parseCheckLogs/checkLogs.types';
import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { InfiniteLogsParams, useInfiniteLogs } from 'data/useInfiniteLogs';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSceneRefreshPicker } from 'scenes/Common/useSceneRefreshPicker';
import { useSceneVar } from 'scenes/Common/useSceneVar';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import {
  REF_ID_EXECUTION_LIST_LOGS,
  REF_ID_MAX_PROBE_DURATION,
  REF_ID_UNIQUE_CHECK_CONFIGS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  CheckConfig,
  CheckConfigRaw,
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointStatus,
  TimepointVizOptions,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildConfigTimeRanges,
  buildLogsMap,
  buildTimepoints,
  extractFrequenciesAndConfigs,
  getCouldBePending,
  getPendingProbeNames,
  getTimeAdjustedTimepoint,
  getVisibleTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export function useVisibleTimepoints() {
  const { miniMapCurrentPage, miniMapPages, timepoints } = useTimepointExplorerContext();
  return getVisibleTimepoints({ timepoints, miniMapCurrentPage, miniMapPages });
}

export function useBuiltCheckConfigs(check: Check, from: UnixTimestamp) {
  const [timeRange] = useTimeRange();
  const probeVar = useSceneVar('probe');
  const timeRangeTo = timeRange.to.valueOf();

  const {
    data: checkConfigsData,
    isLoading: checkConfigsIsLoading,
    refetch: refetchCheckConfigs,
  } = usePersistedCheckConfigs({
    timeRange,
    check,
    probe: probeVar,
  });

  const checkConfigsRaw = useMemo(() => {
    if (checkConfigsData.length > 0) {
      return checkConfigsData;
    }

    return [
      {
        frequency: check.frequency,
        date: from,
      },
    ];
  }, [checkConfigsData, check, from]);

  const firstConfig = checkConfigsRaw[0];
  const needFiller = firstConfig.date > from;

  const checkConfigs = useMemo(() => {
    const filler: CheckConfigRaw = {
      frequency: firstConfig.frequency,
      date: from,
      type: 'no-data',
    };
    const toUse = needFiller ? [filler, ...checkConfigsRaw] : checkConfigsRaw;

    return buildConfigTimeRanges(toUse, timeRangeTo);
  }, [checkConfigsRaw, timeRangeTo, firstConfig.frequency, needFiller, from]);

  return {
    checkConfigs,
    checkConfigsIsLoading,
    refetchCheckConfigs,
  };
}

interface UseTimepointsProps {
  timeRange: TimeRange;
  checkConfigs: CheckConfig[];
  logsRetentionFrom: UnixTimestamp;
}

export function useTimepoints({ timeRange, checkConfigs, logsRetentionFrom }: UseTimepointsProps) {
  const from = Math.max(timeRange.from.valueOf(), logsRetentionFrom);

  return useMemo(() => buildTimepoints({ from, checkConfigs }), [from, checkConfigs]);
}

interface UseExecutionDurationLogsProps {
  check: Check;
  currentAdjustedTime: UnixTimestamp;
  probe?: string[];
  timepoints: StatelessTimepoint[];
  timeRange: { from: UnixTimestamp; to: UnixTimestamp };
}

export function useExecutionDurationLogs({
  timeRange,
  check,
  timepoints,
  probe,
  currentAdjustedTime,
}: UseExecutionDurationLogsProps) {
  const [logsMap, setLogsMap] = useState<Record<UnixTimestamp, StatefulTimepoint>>({});
  const probeExpr = probe?.join('|') || '.*';

  const onSuccess = useCallback(
    (logs: Array<ParsedLokiRecord<ExecutionLabels & EndingLogLabels, ExecutionLabelType>>) => {
      setLogsMap((prev) => ({
        ...prev,
        ...buildLogsMap({ logs, timepoints, check }),
      }));
    },
    [timepoints, check]
  );

  const {
    fetchNextPage,
    hasNextPage,
    data: logsData = [],
    ...rest
  } = usePersistedInfiniteLogs<ExecutionLabels & EndingLogLabels, ExecutionLabelType>({
    refId: REF_ID_EXECUTION_LIST_LOGS,
    expr: `{job="${check.job}", instance="${check.target}", probe=~"${probeExpr}"} | logfmt |="duration_seconds="`,
    start: timeRange.from,
    end: timeRange.to,
  });

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, logsData.length]);

  useEffect(() => {
    onSuccess(logsData);
  }, [logsData, onSuccess]);

  return {
    data: logsData,
    logsMap,
    ...rest,
  };
}

function usePersistedInfiniteLogs<T, R>(props: InfiniteLogsParams<T, R>) {
  const [persistedLogsData, setPersistedLogsData] = useState<Array<ParsedLokiRecord<T, R>>>([]);

  const { data = [], ...rest } = useInfiniteLogs<T, R>(props);

  useEffect(() => {
    if (data.length > 0) {
      // todo: stitch together different pages of data here...
      setPersistedLogsData(data);
    }
  }, [data]);

  return {
    data: persistedLogsData,
    ...rest,
  };
}

interface UseCheckConfigsProps {
  timeRange: TimeRange;
  check: Check;
  refetchInterval?: number;
  probe?: string[];
}

export function usePersistedCheckConfigs({ timeRange, check, probe, refetchInterval }: UseCheckConfigsProps) {
  const [persistedCheckConfigs, setPersistedCheckConfigs] = useState<CheckConfigRaw[]>([]);

  const { data = [], ...rest } = useCheckConfigs({ timeRange, check, probe, refetchInterval });

  useEffect(() => {
    if (data.length > 0) {
      setPersistedCheckConfigs(data);
    }
  }, [data]);

  return { data: persistedCheckConfigs, ...rest };
}

function useCheckConfigs({ timeRange, check, probe, refetchInterval }: UseCheckConfigsProps) {
  const metricsDS = useMetricsDS();
  const { expr, interval, queryType } = getCheckConfigsQuery({
    job: check.job,
    instance: check.target,
    probe: probe?.join('|'),
  });

  return useQuery({
    queryKey: [
      'uniqueCheckConfigs',
      metricsDS,
      expr,
      queryType,
      REF_ID_UNIQUE_CHECK_CONFIGS,
      timeRange.from,
      timeRange.to,
      interval,
    ],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject('No metrics data source found');
      }

      return queryMimir({
        datasource: metricsDS,
        query: expr,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        refId: REF_ID_UNIQUE_CHECK_CONFIGS,
        queryType,
        interval,
      });
    },
    refetchInterval,
    select: (data) => {
      const configs = data.map((d) => extractFrequenciesAndConfigs(d)).flat();
      return configs;
    },
  });
}

const MILLISECONDS_PER_SECOND = 1000;

interface UseMaxProbeDurationProps {
  timeRange: TimeRange;
  check: Check;
  probe?: string[];
}

export function usePersistedMaxProbeDuration({ timeRange, check, probe }: UseMaxProbeDurationProps) {
  const [persistedMaxProbeDuration, setPersistedMaxProbeDuration] = useState<number>(0);

  const { data = 0, ...rest } = useMaxProbeDuration({ timeRange, check, probe });

  useEffect(() => {
    if (data > 0) {
      setPersistedMaxProbeDuration(data);
    }
  }, [data]);

  return { data: persistedMaxProbeDuration, ...rest };
}

function useMaxProbeDuration({ timeRange, check, probe }: UseMaxProbeDurationProps) {
  const metricsDS = useMetricsDS();

  return useQuery({
    queryKey: [
      'aggregation',
      metricsDS,
      check.job,
      check.target,
      REF_ID_MAX_PROBE_DURATION,
      timeRange.from,
      timeRange.to,
      probe,
      check.frequency,
    ],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject('No metrics data source found');
      }

      const { expr, queryType, interval } = getCheckProbeMaxDuration({
        job: check.job,
        instance: check.target,
        probe: probe?.join('|'),
        frequency: check.frequency,
      });

      return queryMimir({
        datasource: metricsDS,
        query: expr,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        refId: REF_ID_MAX_PROBE_DURATION,
        queryType,
        interval,
      });
    },
    select: (data) => {
      const values = data.map((d) => d.fields[1].values).flat();
      const max = Math.max(...values);

      // Convert seconds to milliseconds
      return Math.round(max * MILLISECONDS_PER_SECOND);
    },
  });
}

export function useStatefulTimepoint(timepoint: StatelessTimepoint) {
  const { currentAdjustedTime, logsMap, maxProbeDuration } = useTimepointExplorerContext();
  const entry = logsMap[timepoint.adjustedTime];

  if (!entry) {
    const couldBePending = getCouldBePending(timepoint, currentAdjustedTime);

    const defaultState: StatefulTimepoint = {
      adjustedTime: timepoint.adjustedTime,
      config: timepoint.config,
      probeResults: {},
      index: timepoint.index,
      maxProbeDuration: maxProbeDuration / 3,
      timepointDuration: timepoint.timepointDuration,
      status: couldBePending ? 'pending' : 'missing',
    };

    return defaultState;
  }

  return entry;
}

interface UseIsResultPendingProps {
  check: Check;
  currentAdjustedTime: UnixTimestamp;
  handleRefetch: () => void;
  logsMap: Record<UnixTimestamp, StatefulTimepoint>;
}

export function useIsListResultPending({
  check,
  currentAdjustedTime,
  handleRefetch,
  logsMap,
}: UseIsResultPendingProps) {
  const selectedProbeNames = useSceneVarProbes(check);
  const refreshPickerState = useSceneRefreshPicker(handleRefetch);
  const refreshInMs = refreshPickerState?.refreshInMs;
  const entry = logsMap[currentAdjustedTime];

  const probeNamesPending = getPendingProbeNames({
    statefulTimepoint: entry,
    selectedProbeNames,
  });

  // because the timerange updates when the refresh picker is enabled
  // that will trigger a refetch and it doesn't have to be handled manually
  const enableRefetch = Boolean(probeNamesPending.length) && !refreshInMs;

  useRefetchInterval(enableRefetch, handleRefetch);
}

export function useRefetchInterval(isPending: boolean, handleRefetch: () => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPending && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        handleRefetch();
      }, 3000);
    }

    if (!isPending) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPending, handleRefetch]);
}

export function useTimepointVizOptions(status: TimepointStatus) {
  const { vizOptions } = useTimepointExplorerContext();
  const theme = useTheme2();
  const option = vizOptions[status];

  const options: TimepointVizOptions = useMemo(() => {
    return {
      success: {
        border: option,
        backgroundColor: 'transparent',
        textColor: option,
        statusColor: option,
      },
      failure: {
        border: `transparent`,
        backgroundColor: option,
        textColor: theme.colors.getContrastText(option),
        statusColor: option,
      },
      missing: {
        border: option,
        backgroundColor: 'transparent',
        textColor: theme.colors.getContrastText(option),
        statusColor: option,
      },
      pending: {
        border: option,
        backgroundColor: 'transparent',
        textColor: option,
        statusColor: option,
      },
    };
  }, [theme, option]);

  const vizOption = options[status];

  return vizOption;
}

export function useCurrentAdjustedTime(check: Check) {
  const timeNow = new Date().getTime();
  const [currentAdjustedTime, setCurrentAdjustedTime] = useState<UnixTimestamp>(
    getTimeAdjustedTimepoint(timeNow, check.frequency)
  );
  const delay = timeNow % check.frequency;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const adjustedTime = getTimeAdjustedTimepoint(timeNow, check.frequency);
      setCurrentAdjustedTime(adjustedTime);
      clearTimeout(timeout);

      setInterval(() => {
        const adjustedTime = getTimeAdjustedTimepoint(new Date().getTime(), check.frequency);
        setCurrentAdjustedTime(adjustedTime);
      }, check.frequency);
    }, delay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [check.frequency, delay, timeNow]);

  return currentAdjustedTime;
}
