import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeRange } from '@grafana/data';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';
import { getCheckProbeMaxDuration } from 'queries/getCheckProbeMaxDuration';
import { useResizeObserver } from 'usehooks-ts';

import { CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { InfiniteLogsParams, useInfiniteLogs } from 'data/useInfiniteLogs';
import { useMetricsDS } from 'hooks/useMetricsDS';
import {
  REF_ID_CHECK_LOGS,
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
  buildTimepoints,
  calculateUptimeValue,
  extractFrequenciesAndConfigs,
  getMaxProbeDuration,
  getVisibleTimepoints,
  timeshiftedTimepoint,
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
}

export function useExecutionEndingLogs({ timeRange, check, timepoints }: UseExecutionEndingLogsProps) {
  const { data = [], ...rest } = usePersistedInfiniteLogs<CheckLabels & EndingLogLabels, CheckLabelType>({
    refId: REF_ID_CHECK_LOGS,
    expr: `{job="${check.job}", instance="${check.target}"} | logfmt |="duration_seconds="`,
    start: timeRange.from,
    end: timeRange.to,
  });

  const {
    fetchNextPage,
    hasNextPage,
    data: logsData = [],
  } = usePersistedInfiniteLogs<CheckLabels & EndingLogLabels, CheckLabelType>({
    refId: REF_ID_CHECK_LOGS,
    expr: `{job="${check.job}", instance="${check.target}"} | logfmt |="duration_seconds="`,
    start: timeRange.from,
    end: timeRange.to,
  });

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, logsData.length]);

  const logsMap = useMemo(() => {
    return logsData.reduce<Record<UnixTimestamp, StatefulTimepoint>>((acc, log) => {
      const duration = log.labels.duration_seconds ? Number(log.labels.duration_seconds) * 1000 : 0;
      const startingTime = log.Time - duration;

      // TODO: this is not efficient, we should find a better way to do this
      // the problem is when a check is updated with a new frequency you get a funny timepoint
      const timepoint = timepoints.find(
        (t: StatelessTimepoint) =>
          startingTime >= t.adjustedTime && startingTime <= t.adjustedTime + t.timepointDuration
      );

      if (!timepoint) {
        return acc;
      }

      const timeshiftedStartingTime = timeshiftedTimepoint(startingTime, check.frequency);
      const executions = [
        ...(acc[timeshiftedStartingTime]?.executions || []),
        {
          probe: log.labels.probe,
          execution: log,
          id: log[LokiFieldNames.ID],
        },
      ];

      acc[timeshiftedStartingTime] = {
        adjustedTime: timepoint.adjustedTime,
        timepointDuration: timepoint.timepointDuration,
        frequency: timepoint.frequency,
        executions,
        uptimeValue: calculateUptimeValue(executions),
        maxProbeDuration: getMaxProbeDuration(executions),
      };

      return acc;
    }, {});
  }, [logsData, check.frequency, timepoints]);

  return {
    data: logsData,
    logsMap,
    ...rest,
  };
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

export function useExplorerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref,
    onResize: () => {
      setWidth(ref.current?.clientWidth ?? 0);
    },
  });

  return { width, ref };
}
