import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { colorManipulator } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { useTheme2 } from '@grafana/ui';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';
import { getCheckProbeMaxDuration } from 'queries/getCheckProbeMaxDuration';

import {
  ExecutionLabels,
  ExecutionLabelType,
  FailedLogLabels,
  SucceededLogLabels,
} from 'features/parseCheckLogs/checkLogs.types';
import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { Check } from 'types';
import { InfiniteLogsParams, useInfiniteLogs } from 'data/useInfiniteLogs';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSceneAnnotation } from 'scenes/Common/useSceneAnnotation';
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
  CheckEvent,
  CheckEventType,
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointStatus,
  TimepointVizOptions,
  UnixTimestamp,
  ViewerState,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildConfigTimeRanges,
  buildlistLogsMap,
  buildTimepoints,
  extractFrequenciesAndConfigs,
  getCouldBePending,
  getIsInTheFuture,
  getPendingProbeNames,
  getTimeAdjustedTimepoint,
  getVisibleTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export function useVisibleTimepoints() {
  const { miniMapCurrentPage, miniMapPages, timepoints } = useTimepointExplorerContext();
  return getVisibleTimepoints({ timepoints, miniMapCurrentPage, miniMapPages });
}

interface UseBuiltCheckConfigsProps {
  check: Check;
  from: UnixTimestamp;
  probe?: string[];
  to: UnixTimestamp;
}

export function useBuiltCheckConfigs({ check, from, to, probe }: UseBuiltCheckConfigsProps) {
  const lastModified = Math.round(check.modified! * 1000);

  const { data: checkConfigsData, ...rest } = usePersistedCheckConfigs({
    from,
    to,
    check,
    probe,
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

  const withLatest = useMemo(() => {
    const latest = checkConfigsRaw[checkConfigsRaw.length - 1];

    // apparently they aren't exact...
    // reduce to second accurate rather than millisecond accurate
    if (Math.round(latest.date / 1000) === Math.round(lastModified / 1000)) {
      return checkConfigsRaw;
    }

    return [
      ...checkConfigsRaw,
      {
        date: lastModified,
        frequency: check.frequency,
      },
    ];
  }, [checkConfigsRaw, lastModified, check]);

  const firstConfig = withLatest[0];
  const needFiller = BigInt(firstConfig.date) > BigInt(from);

  const checkConfigs = useMemo(() => {
    const filler: CheckConfigRaw = {
      frequency: firstConfig.frequency,
      date: from,
      type: 'no-data',
    };
    const toUse = needFiller ? [filler, ...withLatest] : withLatest;

    return buildConfigTimeRanges(toUse, to);
  }, [withLatest, to, firstConfig.frequency, needFiller, from]);

  return {
    checkConfigs,
    ...rest,
  };
}

interface UseTimepointsProps {
  checkConfigs: CheckConfig[];
  limitFrom: UnixTimestamp;
  limitTo: UnixTimestamp;
}

export function useTimepoints({ checkConfigs, limitFrom, limitTo }: UseTimepointsProps) {
  return useMemo(() => {
    return buildTimepoints({ checkConfigs, limitFrom, limitTo });
  }, [limitFrom, limitTo, checkConfigs]);
}

interface UseExecutionDurationLogsProps {
  check: Check;
  probe?: string[];
  timepoints: StatelessTimepoint[];
  timeRange: { from: UnixTimestamp; to: UnixTimestamp };
}

export function useExecutionDurationLogs({ check, probe, timepoints, timeRange }: UseExecutionDurationLogsProps) {
  const probeExpr = probe?.join('|') || '.*';
  const prevListLogsMap = useRef({});

  const {
    fetchNextPage,
    hasNextPage,
    data: logsData = [],
    ...rest
  } = usePersistedInfiniteLogs<ExecutionLabels & (FailedLogLabels | SucceededLogLabels), ExecutionLabelType>({
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

  const listLogsMap = useMemo(() => {
    const build = buildlistLogsMap({ logs: logsData, timepoints });
    const res = {
      ...prevListLogsMap.current,
      ...build,
    };

    prevListLogsMap.current = res;

    return res;
  }, [logsData, timepoints]);

  return {
    data: logsData,
    listLogsMap,
    ...rest,
  };
}

function usePersisted<T>(data: T, shouldUpdate: (data: T) => boolean) {
  const persistedDataRef = useRef<T>(data);

  if (shouldUpdate(data)) {
    persistedDataRef.current = data;
  }

  return persistedDataRef.current;
}

function usePersistedInfiniteLogs<T, R>(props: InfiniteLogsParams<T, R>) {
  const { data = [], ...rest } = useInfiniteLogs<T, R>(props);
  const shouldUpdate = useCallback((data: Array<ParsedLokiRecord<T, R>>) => data.length > 0, []);
  const persistedData = usePersisted<Array<ParsedLokiRecord<T, R>>>(data, shouldUpdate);

  return {
    data: persistedData,
    ...rest,
  };
}

interface UseCheckConfigsProps {
  check: Check;
  from: UnixTimestamp;
  probe?: string[];
  to: UnixTimestamp;
}

export function usePersistedCheckConfigs({ from, to, check, probe }: UseCheckConfigsProps) {
  const { data = [], ...rest } = useCheckConfigs({ from, to, check, probe });
  const persistedData = usePersisted<CheckConfigRaw[]>(data, (data) => data.length > 0);

  return { data: persistedData, ...rest };
}

function useCheckConfigs({ from, to, check, probe }: UseCheckConfigsProps) {
  const metricsDS = useMetricsDS();
  const { expr, interval, queryType } = getCheckConfigsQuery({
    job: check.job,
    instance: check.target,
    probe: probe?.join('|'),
  });

  return useQuery({
    queryKey: ['uniqueCheckConfigs', metricsDS, expr, queryType, REF_ID_UNIQUE_CHECK_CONFIGS, from, to, interval],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject('No metrics data source found');
      }

      return queryMimir({
        datasource: metricsDS,
        query: expr,
        start: from,
        end: to,
        refId: REF_ID_UNIQUE_CHECK_CONFIGS,
        queryType,
        interval,
      });
    },
    select: (data) => {
      const configs = data.map((d) => extractFrequenciesAndConfigs(d)).flat();
      return configs;
    },
    enabled: from < to,
  });
}

const MILLISECONDS_PER_SECOND = 1000;

interface UseMaxProbeDurationProps {
  check: Check;
  from: UnixTimestamp;
  probe?: string[];
  to: UnixTimestamp;
}

export function usePersistedMaxProbeDuration({ from, to, check, probe }: UseMaxProbeDurationProps) {
  const { data = 0, ...rest } = useMaxProbeDuration({ from, to, check, probe });
  const shouldUpdate = useCallback((data: number) => data > 0, []);
  const persistedMaxProbeDuration = usePersisted<number>(data, shouldUpdate);

  return { data: persistedMaxProbeDuration, ...rest };
}

function useMaxProbeDuration({ from, to, check, probe }: UseMaxProbeDurationProps) {
  const metricsDS = useMetricsDS();

  return useQuery({
    queryKey: ['aggregation', metricsDS, check.job, check.target, REF_ID_MAX_PROBE_DURATION, from, to, probe],
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
        start: from,
        end: to,
        refId: REF_ID_MAX_PROBE_DURATION,
        queryType,
      });
    },
    select: (data) => {
      const values = data.map((d) => d.fields?.[1]?.values || []).flat();

      const max = Math.max(...values);

      // Convert seconds to milliseconds
      return Math.round(max * MILLISECONDS_PER_SECOND);
    },
    enabled: from < to,
  });
}

export function useStatefulTimepoint(timepoint: StatelessTimepoint) {
  const { currentAdjustedTime, listLogsMap, yAxisMax } = useTimepointExplorerContext();
  const entry = listLogsMap[timepoint.adjustedTime];

  if (!entry) {
    const couldBePending = getCouldBePending(timepoint, currentAdjustedTime);

    const UNKNOWN_STATE: StatefulTimepoint = {
      adjustedTime: timepoint.adjustedTime,
      config: timepoint.config,
      probeResults: {},
      index: timepoint.index,
      maxProbeDuration: yAxisMax / 3,
      timepointDuration: timepoint.timepointDuration,
      status: couldBePending ? 'pending' : 'missing',
    };

    return UNKNOWN_STATE;
  }

  return entry;
}

interface UseIsResultPendingProps {
  check: Check;
  currentAdjustedTime: UnixTimestamp;
  handleRefetch: () => void;
  listLogsMap: Record<UnixTimestamp, StatefulTimepoint>;
}

export function useIsListResultPending({
  check,
  currentAdjustedTime,
  handleRefetch,
  listLogsMap,
}: UseIsResultPendingProps) {
  const [timeRange] = useTimeRange();

  const isCurrentTimeInSelectedTimeRange =
    currentAdjustedTime > timeRange.from.valueOf() && currentAdjustedTime < timeRange.to.valueOf();
  const selectedProbeNames = useSceneVarProbes(check);
  const refreshPickerState = useSceneRefreshPicker(handleRefetch);
  const refreshInMs = refreshPickerState?.refreshInMs;
  const entry = listLogsMap[currentAdjustedTime];

  const probeNamesPending = getPendingProbeNames({
    statefulTimepoint: entry,
    selectedProbeNames,
  });

  // because the timerange updates when the refresh picker is enabled
  // that will trigger a refetch and it doesn't have to be handled manually
  const enableRefetch = isCurrentTimeInSelectedTimeRange && Boolean(probeNamesPending.length) && !refreshInMs;

  useRefetchInterval(enableRefetch, handleRefetch);
}

export function useRefetchInterval(isPending: boolean, handleRefetch: () => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPending && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        handleRefetch();
      }, 5000);
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

const ALPHA_OPACITY = 0.25;

export function useTimepointVizOptions(status: TimepointStatus) {
  const { vizOptions } = useTimepointExplorerContext();
  const theme = useTheme2();
  const option = vizOptions[status];

  const options: TimepointVizOptions = useMemo(() => {
    const alphaOption = colorManipulator.alpha(option, ALPHA_OPACITY);

    return {
      success: {
        border: option,
        backgroundColor: alphaOption,
        textColor: theme.colors.getContrastText(alphaOption),
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
        backgroundColor: alphaOption,
        textColor: theme.colors.getContrastText(alphaOption),
        statusColor: option,
      },
      pending: {
        border: option,
        backgroundColor: alphaOption,
        textColor: theme.colors.getContrastText(alphaOption),
        statusColor: option,
      },
    };
  }, [theme, option]);

  const vizOption = options[status];

  return vizOption;
}

export function useCurrentAdjustedTime(check: Check) {
  const checkCreation = Math.round(check.created! * 1000);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const adjustedNowTime = getTimeAdjustedTimepoint(new Date().getTime(), check.frequency);
  const initial = Math.max(adjustedNowTime, checkCreation);
  const [currentAdjustedTime, setCurrentAdjustedTime] = useState<UnixTimestamp>(initial);

  useEffect(() => {
    const delay = check.frequency - (new Date().getTime() % check.frequency);

    timeoutRef.current = setTimeout(() => {
      const adjustedTime = getTimeAdjustedTimepoint(new Date().getTime(), check.frequency);
      setCurrentAdjustedTime(adjustedTime);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

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

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [check.frequency]);

  return currentAdjustedTime;
}

interface UseIsInitialisedProps {
  check: Check;
  currentAdjustedTime: UnixTimestamp;
  handleViewerStateChange: (viewerState: ViewerState) => void;
  isLoading: boolean;
  timepoints: StatelessTimepoint[];
}

export function useIsInitialised({
  check,
  isLoading,
  handleViewerStateChange,
  timepoints,
  currentAdjustedTime,
}: UseIsInitialisedProps) {
  const probeVar = useSceneVarProbes(check);
  const persistedIsLoading = usePersisted(isLoading, (isLoading) => !isLoading);

  const handleOnInitialised = useCallback(() => {
    const notInTheFuture = timepoints.filter((t) => !getIsInTheFuture(t, currentAdjustedTime));
    // todo: add logic to pick a sensible entry depending on how close a timepoint is to the creation date
    // e.g. if you create a time point with two seconds until the end of the timepoint, the user will essentially
    // see a missing result as the first entry
    // might make sense to bump the creation time artificially so it aligns with the timepoint?
    const lastNotInTheFuture = notInTheFuture[notInTheFuture.length - 1] || timepoints[0];
    const firstProbe = probeVar[0];

    handleViewerStateChange([lastNotInTheFuture, firstProbe, 0]);
  }, [currentAdjustedTime, probeVar, timepoints, handleViewerStateChange]);

  useEffect(() => {
    // we have to wait until we have the checkConfigs and subsequent timepoints built
    // before knowing what timepoints are available and what to select
    if (!persistedIsLoading) {
      handleOnInitialised();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want to run this once
  }, [persistedIsLoading]);

  return !persistedIsLoading;
}

export function useSelectedProbeNames(statefulTimepoint: StatefulTimepoint) {
  const { check, checkConfigs } = useTimepointExplorerContext();
  const latestConfigDate = checkConfigs[checkConfigs.length - 1].from;
  const isCurrentConfig = statefulTimepoint.config.from === latestConfigDate;
  const probeVarRaw = useSceneVar('probe');
  const probeVar = useSceneVarProbes(check);

  return !isCurrentConfig && probeVarRaw.includes('.*') ? Object.keys(statefulTimepoint.probeResults) : probeVar;
}

export function useSceneAnnotationEvents() {
  const alertsFiring = useSceneAnnotation('Alerts firing');
  const alertsPending = useSceneAnnotation('Alerts pending');

  const alertFiringEvents = alertsFiring.map<CheckEvent>(([timeStart, timeEnd]) => ({
    label: CheckEventType.ALERTS_FIRING,
    to: timeEnd,
    from: timeStart,
    color: 'red',
  }));

  const alertPendingEvents = alertsPending.map<CheckEvent>(([timeStart, timeEnd]) => ({
    label: CheckEventType.ALERTS_PENDING,
    to: timeEnd,
    from: timeStart,
    color: 'yellow',
  }));

  return [...alertFiringEvents, ...alertPendingEvents];
}
