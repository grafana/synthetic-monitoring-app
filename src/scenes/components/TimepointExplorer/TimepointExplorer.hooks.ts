import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataFrame, TimeRange } from '@grafana/data';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';
import { getCheckProbeMaxDuration } from 'queries/getCheckProbeMaxDuration';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

import { CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { Check } from 'types';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { useMetricsDS } from 'hooks/useMetricsDS';
import {
  MAX_PROBE_DURATION_DEFAULT,
  REF_ID_CHECK_LOGS,
  REF_ID_MAX_PROBE_DURATION,
  REF_ID_UNIQUE_CHECK_CONFIGS,
  THEME_UNIT,
  TIMEPOINT_GAP,
  TIMEPOINT_SIZE,
  VIEW_OPTIONS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  Timepoint,
  TimepointsObj,
  UnixTimestamp,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  calculateUptimeValue,
  configTimeRanges,
  findActiveSection,
  getMaxProbeDuration,
  minimapSections,
  timeshiftedTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

type Size = {
  width?: number;
};

export function useTimepointExplorerView(timepoints: Timepoint[], initialTimeRangeToInView: UnixTimestamp) {
  const ref = useRef<HTMLDivElement>(null);
  // if we just know when the view is to we can anchor the view from that
  const [viewTimeRangeTo, setViewTimeRangeTo] = useState<UnixTimestamp>(initialTimeRangeToInView);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_OPTIONS[0].value);

  const [{ width = 0 }, setSize] = useState<Size>({
    width: 0,
  });

  const onResize = useDebounceCallback(() => {
    const width = ref.current?.clientWidth ?? 0;
    setSize({ width });

    const timepointsToDisplay = Math.ceil(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP * THEME_UNIT));
    const miniMapSections = minimapSections(timepoints, timepointsToDisplay, viewTimeRangeTo);
    const activeSection = findActiveSection(miniMapSections, viewTimeRangeTo);

    if (activeSection) {
      setViewTimeRangeTo(activeSection.to);
    }
  }, 300);

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref,
    onResize,
  });

  useEffect(() => {
    setViewTimeRangeTo(initialTimeRangeToInView);
  }, [initialTimeRangeToInView]);

  const timepointDisplayCount = Math.ceil(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP * THEME_UNIT));
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

interface UseTimepointExplorerProps {
  timeRange: TimeRange;
  check: Check;
}

export function useTimepoints({ timeRange, check }: UseTimepointExplorerProps) {
  const { data: checkConfigs = [] } = useCheckConfigs({ timeRange, check });
  const from = timeRange.from.valueOf();
  const to = timeRange.to.valueOf();

  const timepointsInRange = useTimepointsInRange({
    from,
    to,
    checkConfigs,
  });

  const {
    fetchNextPage,
    hasNextPage,
    data: logsData = [],
  } = useInfiniteLogs<CheckLabels & EndingLogLabels, CheckLabelType>({
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

  const builtConfigs = useMemo(
    () => configTimeRanges(checkConfigs, timeRange.to.valueOf()),
    [checkConfigs, timeRange.to]
  );

  const timepoints = useMemo(() => {
    if (!checkConfigs.length) {
      return timepointsInRange;
    }

    return logsData.reduce<TimepointsObj>((acc, log) => {
      const frequency = builtConfigs.find((c) => log.Time >= c.from && log.Time < c.to)?.frequency;

      if (!frequency) {
        // should be impossible
        console.log('No frequency found for log', log);
        return acc;
      }

      const adjustedTime = timeshiftedTimepoint(log.Time, frequency) + frequency;

      if (adjustedTime < from || adjustedTime > to) {
        // log is outside of the time range
        return acc;
      }

      if (!acc[adjustedTime]) {
        acc[adjustedTime] = {
          probes: [],
          uptimeValue: -1,
          adjustedTime,
          frequency,
          index: -1,
          maxProbeDuration: -1,
        };
      }

      // deduplicate logs
      if (!acc[adjustedTime].probes.find((p) => p.id === log.id)) {
        acc[adjustedTime].probes.push(log);
      }

      acc[adjustedTime].uptimeValue = calculateUptimeValue(acc[adjustedTime].probes);
      acc[adjustedTime].maxProbeDuration = getMaxProbeDuration(acc[adjustedTime].probes);

      return acc;
    }, timepointsInRange);
  }, [logsData, timepointsInRange, builtConfigs, from, to, checkConfigs.length]);

  return useMemo(() => {
    const values = Object.values(timepoints);
    const sorted = values.sort((a, b) => a.adjustedTime - b.adjustedTime);
    const firstEntry = sorted[0];

    // assume the first entry didn't look far enough back in time to get the logs associated with it so can be removed
    if (firstEntry?.probes.length === 0) {
      sorted.shift();
    }

    return sorted.reverse();
  }, [timepoints]);
}

function useCheckConfigs({ timeRange, check }: UseTimepointExplorerProps) {
  const metricsDS = useMetricsDS();
  const { expr, queryType } = getCheckConfigsQuery({ job: check.job, instance: check.target });

  return useQuery({
    queryKey: ['uniqueCheckConfigs', metricsDS, expr, timeRange, queryType, REF_ID_UNIQUE_CHECK_CONFIGS],
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
    select: (data) => {
      return extractFrequenciesAndConfigs(data);
    },
  });
}

const NANOSECONDS_PER_MILLISECOND = 1000000;

function extractFrequenciesAndConfigs(data: DataFrame) {
  let build: Array<{ frequency: number; date: UnixTimestamp }> = [];

  const Value = data.fields[1];

  if (Value.labels) {
    const { config_version, frequency } = Value.labels;
    const toUnixTimestamp = Math.round(Number(config_version) / NANOSECONDS_PER_MILLISECOND);
    const date: UnixTimestamp = toUnixTimestamp;

    build.push({
      frequency: Number(frequency),
      date,
    });
  }

  return build;
}
interface UseTimepointsInRangeProps {
  from: UnixTimestamp;
  to: UnixTimestamp;
  checkConfigs: Array<{ frequency: number; date: UnixTimestamp }>;
}

function useTimepointsInRange({ from, to, checkConfigs }: UseTimepointsInRangeProps) {
  return useMemo(() => {
    const rangeFrom = from;
    const rangeTo = to;

    // work backwards
    let configs = [...checkConfigs];

    // start with the latest config
    let currentConfig = configs.pop();

    // mutate for efficiency
    let build: Record<UnixTimestamp, Timepoint> = {};

    if (!currentConfig) {
      return build;
    }

    // remove non-full frequency timepoints
    let currentTimepoint = timeshiftedTimepoint(rangeTo, currentConfig.frequency);
    let count = 0;

    while (currentTimepoint >= rangeFrom && currentConfig) {
      const currentFrequency = currentConfig.frequency;
      const uptoDate = currentTimepoint - (currentTimepoint % currentFrequency);

      for (let i = uptoDate; i <= currentTimepoint; i += currentFrequency) {
        build[i] = {
          probes: [],
          uptimeValue: -1,
          adjustedTime: i,
          frequency: currentFrequency,
          index: count,
          maxProbeDuration: -1,
        };
      }

      currentTimepoint = uptoDate - currentFrequency;

      if (currentTimepoint.valueOf() < currentConfig.date.valueOf()) {
        currentConfig = configs.pop();
      }
      count++;
    }

    return build;
  }, [from, to, checkConfigs]);
}

const MILLISECONDS_PER_SECOND = 1000;

export function useMaxProbeDuration(timeRange: TimeRange, check: Check) {
  const metricsDS = useMetricsDS();

  const { data: maxProbeDurationData = 0, isLoading } = useQuery({
    queryKey: [
      'aggregation',
      metricsDS,
      check.job,
      check.target,
      timeRange.from.valueOf(),
      timeRange.to.valueOf(),
      REF_ID_MAX_PROBE_DURATION,
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
    select: (data) => {
      // Convert seconds to milliseconds
      const res = Math.round(data.fields[1].values[0] * MILLISECONDS_PER_SECOND);
      return res;
    },
  });

  const data = maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;

  return { data, isLoading };
}
