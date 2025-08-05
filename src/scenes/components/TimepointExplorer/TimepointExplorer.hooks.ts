import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeRange } from '@grafana/data';
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
import {
  REF_ID_EXECUTION_LIST_LOGS,
  REF_ID_MAX_PROBE_DURATION,
  REF_ID_UNIQUE_CHECK_CONFIGS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  CheckConfig,
  StatefulTimepoint,
  StatelessTimepoint,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
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

interface UseTimepointsProps {
  timeRange: TimeRange;
  checkConfigs: CheckConfig[];
}

export function useTimepoints({ timeRange, checkConfigs }: UseTimepointsProps) {
  const from = timeRange.from.valueOf();
  const to = timeRange.to.valueOf();

  return useMemo(() => buildTimepoints({ from, to, checkConfigs }), [from, to, checkConfigs]);
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
  const [persistedCheckConfigs, setPersistedCheckConfigs] = useState<CheckConfig[]>([]);

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
        maxDataPoints: 11000,
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
  refetchInterval?: number;
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

function useMaxProbeDuration({ timeRange, check, probe, refetchInterval }: UseMaxProbeDurationProps) {
  const metricsDS = useMetricsDS();

  const {
    data = 0,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      'aggregation',
      metricsDS,
      check.job,
      check.target,
      REF_ID_MAX_PROBE_DURATION,
      timeRange.from,
      timeRange.to,
      probe,
    ],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject('No metrics data source found');
      }

      const { expr, queryType } = getCheckProbeMaxDuration({
        job: check.job,
        instance: check.target,
        probe: probe?.join('|'),
      });

      return queryMimir({
        datasource: metricsDS,
        query: expr,
        start: timeRange.from.valueOf(),
        end: timeRange.to.valueOf(),
        refId: REF_ID_MAX_PROBE_DURATION,
        queryType,
      });
    },
    refetchInterval,
    select: (data) => {
      // Convert seconds to milliseconds
      const values = data.map((d) => d.fields[1].values[0]);
      const max = Math.max(...values);
      return Math.round(max * MILLISECONDS_PER_SECOND);
    },
  });

  return { data, isLoading, refetch };
}

export function useStatefulTimepoint(timepoint: StatelessTimepoint) {
  const { logsMap, maxProbeDuration, timepoints, isResultPending } = useTimepointExplorerContext();
  const isPendingEntry = isResultPending && timepoints.length - 1 === timepoint.index;

  const defaultState: StatefulTimepoint = {
    uptimeValue: isPendingEntry ? 2 : -1,
    maxProbeDuration: maxProbeDuration / 2,
    executions: [],
    adjustedTime: timepoint.adjustedTime,
    timepointDuration: timepoint.timepointDuration,
    frequency: timepoint.frequency,
    index: timepoint.index,
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
  const selectedProbes = useSceneVar('probe');
  const { data: probes = [] } = useProbes();
  const isResultPending = getIsResultPending({ check, logsMap, selectedProbes, timepoints, probes });
  const state = useSceneRefreshPicker();

  const refreshInMs = state?.refreshInMs;

  useEffect(() => {
    if (refreshInMs) {
      return;
    }

    if (isResultPending && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        handleIsPending();
      }, 3000);
    }

    if (!isResultPending) {
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
  }, [isResultPending, handleIsPending, refreshInMs]);

  return isResultPending;
}
