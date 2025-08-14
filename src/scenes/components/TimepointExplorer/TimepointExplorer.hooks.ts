import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeRange } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';
import { getCheckProbeMaxDuration } from 'queries/getCheckProbeMaxDuration';

import { EndingLogLabels, ExecutionLabels, ExecutionLabelType } from 'features/parseCheckLogs/checkLogs.types';
import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { InfiniteLogsParams, useInfiniteLogs } from 'data/useInfiniteLogs';
import { useProbes } from 'data/useProbes';
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
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildConfigTimeRanges,
  buildLogsMap,
  buildTimepoints,
  extractFrequenciesAndConfigs,
  getIsResultPending,
  getVisibleTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export function useVisibleTimepoints() {
  const { miniMapCurrentPage, miniMapPages, timepoints } = useTimepointExplorerContext();
  return getVisibleTimepoints({ timepoints, miniMapCurrentPage, miniMapPages });
}

export function useBuiltCheckConfigs(check: Check, logsRetentionTo: UnixTimestamp) {
  const [timeRange] = useTimeRange();
  const probeVar = useSceneVar('probe');
  const timeRangeFrom = timeRange.from.valueOf();
  const timeRangeTo = timeRange.to.valueOf();
  const checkCreated = check.created! * 1000;
  const upto = Math.max(logsRetentionTo, checkCreated);
  const fillTo = upto > timeRangeFrom ? upto : timeRangeFrom;

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
        date: fillTo,
      },
    ];
  }, [checkConfigsData, check, fillTo]);

  const firstConfig = checkConfigsRaw[0];
  const needFiller = firstConfig.date > fillTo;

  const checkConfigs = useMemo(() => {
    const filler: CheckConfigRaw = {
      frequency: firstConfig.frequency,
      date: fillTo,
      type: 'no-data',
    };
    const toUse = needFiller ? [filler, ...checkConfigsRaw] : checkConfigsRaw;

    return buildConfigTimeRanges(toUse, timeRangeTo);
  }, [checkConfigsRaw, timeRangeTo, firstConfig.frequency, needFiller, fillTo]);

  return {
    checkConfigs,
    checkConfigsIsLoading,
    refetchCheckConfigs,
  };
}

interface UseTimepointsProps {
  timeRange: TimeRange;
  checkConfigs: CheckConfig[];
  logsRetentionTo: UnixTimestamp;
}

export function useTimepoints({ timeRange, checkConfigs, logsRetentionTo }: UseTimepointsProps) {
  const from = Math.max(timeRange.from.valueOf(), logsRetentionTo);

  return useMemo(() => buildTimepoints({ from, checkConfigs }), [from, checkConfigs]);
}

interface UseExecutionEndingLogsProps {
  timeRange: { from: UnixTimestamp; to: UnixTimestamp };
  check: Check;
  timepoints: StatelessTimepoint[];
  probe?: string[];
}

export function useExecutionEndingLogs({ timeRange, check, timepoints, probe }: UseExecutionEndingLogsProps) {
  const [logsMap, setLogsMap] = useState<Record<UnixTimestamp, StatefulTimepoint>>({});
  const probeExpr = probe?.join('|') || '.*';

  const onSuccess = useCallback(
    (data: Array<ParsedLokiRecord<ExecutionLabels & EndingLogLabels, ExecutionLabelType>>) => {
      setLogsMap((prev) => ({
        ...prev,
        ...buildLogsMap(data, timepoints, check),
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
  const { expr, queryType } = getCheckConfigsQuery({
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
  const { logsMap, maxProbeDuration, pendingResult } = useTimepointExplorerContext();
  const [pendingResultTimepoint] = pendingResult || [];
  const isPendingEntry = pendingResultTimepoint?.index === timepoint.index;

  const defaultState: StatefulTimepoint = {
    adjustedTime: timepoint.adjustedTime,
    config: timepoint.config,
    executions: [],
    index: timepoint.index,
    maxProbeDuration: maxProbeDuration / 2,
    timepointDuration: timepoint.timepointDuration,
    uptimeValue: isPendingEntry ? 2 : -1,
  };

  const entry = logsMap[timepoint.adjustedTime];

  if (!entry) {
    return defaultState;
  }

  return {
    ...entry,
    uptimeValue: isPendingEntry ? 2 : entry.uptimeValue,
  };
}

interface UseIsResultPendingProps {
  handleIsPending: () => void;
  check: Check;
  logsMap: Record<UnixTimestamp, StatefulTimepoint>;
  timepoints: StatelessTimepoint[];
}

export function useIsResultPending({ handleIsPending, check, logsMap, timepoints }: UseIsResultPendingProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedProbes = useSceneVarProbes(check);
  const { data: probes = [] } = useProbes();
  const resultPending = getIsResultPending({
    check,
    logsMap,
    selectedProbes,
    timepoints,
    probes,
  });
  const state = useSceneRefreshPicker();

  const refreshInMs = state?.refreshInMs;

  useEffect(() => {
    // because the timerange updates when the refresh picker is enabled
    // that will trigger a refetch and it doesn't have to be handled manually
    if (refreshInMs) {
      return;
    }

    if (resultPending.length && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        handleIsPending();
      }, 3000);
    }

    if (!resultPending.length) {
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
  }, [resultPending, handleIsPending, refreshInMs]);

  return useMemo(() => resultPending, [resultPending]);
}
