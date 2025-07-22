import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeRange } from '@grafana/data';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';
import { getCheckProbeMaxDuration } from 'queries/getCheckProbeMaxDuration';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

import { CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { InfiniteLogsParams, useInfiniteLogs } from 'data/useInfiniteLogs';
import { useMetricsDS } from 'hooks/useMetricsDS';
import {
  REF_ID_CHECK_LOGS,
  REF_ID_MAX_PROBE_DURATION,
  REF_ID_UNIQUE_CHECK_CONFIGS,
  THEME_UNIT,
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  TIMEPOINT_GAP,
  TIMEPOINT_SIZE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  CheckConfig,
  Timepoint,
  UnixTimestamp,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildTimepoints,
  calculateUptimeValue,
  extractFrequenciesAndConfigs,
  findActiveSection,
  getMaxProbeDuration,
  minimapSections,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export function useTimepointExplorerView(timepoints: Timepoint[], initialTimeRangeToInView: UnixTimestamp) {
  const ref = useRef<HTMLDivElement>(null);
  // if we just know when the view is to we can anchor the view from that
  const [viewTimeRangeTo, setViewTimeRangeTo] = useState<UnixTimestamp>(initialTimeRangeToInView);
  const [viewMode, setViewMode] = useState<ViewMode>(TIMEPOINT_EXPLORER_VIEW_OPTIONS[0].value);

  const [width, setWidth] = useState<number>(ref.current?.clientWidth ?? 0);

  const onResize = useDebounceCallback(() => {
    const width = ref.current?.clientWidth ?? 0;
    setWidth(width);

    const timepointsToDisplay = Math.floor(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP * THEME_UNIT));
    const miniMapSections = minimapSections(timepoints, timepointsToDisplay, viewTimeRangeTo);
    const activeSection = findActiveSection(miniMapSections, viewTimeRangeTo);

    if (activeSection) {
      setViewTimeRangeTo(activeSection.to);
    }
  }, 100);

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref,
    onResize,
  });

  useEffect(() => {
    setViewTimeRangeTo(initialTimeRangeToInView);
  }, [initialTimeRangeToInView]);

  const timepointDisplayCount = Math.floor(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP * THEME_UNIT));
  const miniMapSections = minimapSections(timepoints, timepointDisplayCount, viewTimeRangeTo);
  const activeSection = findActiveSection(miniMapSections, viewTimeRangeTo);

  const handleTimeRangeToInViewChange = useCallback((timeRangeToInView: UnixTimestamp) => {
    setViewTimeRangeTo(timeRangeToInView);
  }, []);

  const handleViewModeChange = useCallback((viewMode: ViewMode) => {
    setViewMode(viewMode);
  }, []);

  return {
    handleTimeRangeToInViewChange,
    ref,
    timepointDisplayCount,
    viewTimeRangeTo,
    width,
    miniMapSections,
    activeSection,
    viewMode,
    handleViewModeChange,
  };
}

interface UseTimepointsProps {
  timeRange: TimeRange;
  check: Check;
  refetchInterval?: number;
}

export function usePersistedTimepoints({ timeRange, check }: UseTimepointsProps) {
  const [persistedTimepoints, setPersistedTimepoints] = useState<Timepoint[]>([]);
  const timepoints = useTimepoints({ timeRange, check });

  useEffect(() => {
    setPersistedTimepoints(timepoints);
  }, [timepoints]);

  return persistedTimepoints;
}

function useTimepoints({ timeRange, check }: UseTimepointsProps) {
  const { data: checkConfigs = [] } = usePersistedCheckConfigs({ timeRange, check });
  const from = timeRange.from.valueOf();
  const to = timeRange.to.valueOf();

  const timepointsInRange = useMemo(() => buildTimepoints({ from, to, checkConfigs }), [from, to, checkConfigs]);

  const {
    fetchNextPage,
    hasNextPage,
    data: logsData = [],
  } = usePersistedInfiniteLogs<CheckLabels & EndingLogLabels, CheckLabelType>({
    refId: REF_ID_CHECK_LOGS,
    expr: `{job="${check.job}", instance="${check.target}"} | logfmt |="duration_seconds="`,
    start: timeRange.from.valueOf(),
    end: timeRange.to.valueOf(),
  });

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, logsData.length]);

  const timepoints = useMemo(() => {
    const copy = [...timepointsInRange]; // necessary?

    logsData.forEach((log) => {
      const duration = log.labels.duration_seconds ? Number(log.labels.duration_seconds) * 1000 : 0;
      const startingTime = log.Time - duration;

      const timepoint = [...copy] // necessary?
        .reverse()
        .find((t) => startingTime >= t.adjustedTime && startingTime <= t.adjustedTime + t.timepointDuration); // not very efficient

      if (!timepoint) {
        console.log('No timepoint found for log -- probably out of selected time range', { log, id: log.id, to, from });
        return;
      }

      // deduplicate logs
      if (!timepoint.probes.find((p) => p.id === log.id)) {
        timepoint.probes.push(log);
      }

      timepoint.uptimeValue = calculateUptimeValue(timepoint.probes);
      timepoint.maxProbeDuration = getMaxProbeDuration(timepoint.probes);
    });

    return copy;
  }, [logsData, timepointsInRange, to, from]);

  return useMemo(() => {
    const reversedTimepoints = timepoints.reverse();
    return reversedTimepoints;
  }, [timepoints]);
}

interface UseCheckConfigsProps {
  timeRange: TimeRange;
  check: Check;
  refetchInterval?: number;
  onSuccess?: (data: CheckConfig[]) => void;
}

function usePersistedInfiniteLogs<T, R>(props: InfiniteLogsParams<T, R>) {
  const [persistedLogsData, setPersistedLogsData] = useState<Array<ParsedLokiRecord<T, R>>>([]);

  const { data = [], ...rest } = useInfiniteLogs<T, R>(props);

  useEffect(() => {
    if (data.length > 0) {
      setPersistedLogsData(data);
    }
  }, [data]);

  return {
    data: persistedLogsData,
    ...rest,
  };
}

export function usePersistedCheckConfigs({ timeRange, check, refetchInterval }: UseCheckConfigsProps) {
  const [persistedCheckConfigs, setPersistedCheckConfigs] = useState<CheckConfig[]>([]);

  const { data = [], ...rest } = useCheckConfigs({ timeRange, check, refetchInterval });

  useEffect(() => {
    if (data.length > 0) {
      setPersistedCheckConfigs(data);
    }
  }, [data]);

  return { data: persistedCheckConfigs, ...rest };
}

function useCheckConfigs({ timeRange, check, refetchInterval }: UseCheckConfigsProps) {
  const metricsDS = useMetricsDS();
  const { expr, queryType } = getCheckConfigsQuery({ job: check.job, instance: check.target });

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
  refetchInterval?: number;
}

export function usePersistedMaxProbeDuration({ timeRange, check }: UseMaxProbeDurationProps) {
  const [persistedMaxProbeDuration, setPersistedMaxProbeDuration] = useState<number>(0);

  const { data = 0, ...rest } = useMaxProbeDuration({ timeRange, check });

  useEffect(() => {
    if (data > 0) {
      setPersistedMaxProbeDuration(data);
    }
  }, [data]);

  return { data: persistedMaxProbeDuration, ...rest };
}

function useMaxProbeDuration({ timeRange, check, refetchInterval }: UseMaxProbeDurationProps) {
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
    ],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject('No metrics data source found');
      }

      const { expr, queryType } = getCheckProbeMaxDuration({ job: check.job, instance: check.target });

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
