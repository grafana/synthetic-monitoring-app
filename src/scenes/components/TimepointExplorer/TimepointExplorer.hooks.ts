import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataFrame, TimeRange } from '@grafana/data';
import { queryMimir } from 'features/queryDatasources/queryMimir';
import { getCheckConfigsQuery } from 'queries/getCheckConfigsQuery';
import { useDebounceCallback, useResizeObserver } from 'usehooks-ts';

import { CheckLabel, CheckLabelType } from 'features/parseCheckLogs/checkLogs.types';
import { Check } from 'types';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { useMetricsDS } from 'hooks/useMetricsDS';
import {
  REF_ID_CHECK_LOGS,
  REF_ID_UNIQUE_CHECK_CONFIGS,
  THEME_UNIT,
  TIMEPOINT_GAP,
  TIMEPOINT_WIDTH,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Timepoints, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  configTimeRanges,
  findActiveSection,
  minimapSections,
  timeshiftedTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

type Size = {
  width?: number;
};

export function useTimepointExplorerView(timepoints: Timepoints, initialTimeRangeToInView: UnixTimestamp) {
  const ref = useRef<HTMLDivElement>(null);
  // if we just know when the view is to we can anchor the view from that
  const [viewTimeRangeTo, setViewTimeRangeTo] = useState<UnixTimestamp>(initialTimeRangeToInView);

  const [{ width = 0 }, setSize] = useState<Size>({
    width: 0,
  });

  const onResize = useDebounceCallback(() => {
    const width = ref.current?.clientWidth ?? 0;
    setSize({ width });

    const timepointsToDisplay = Math.ceil(width / (TIMEPOINT_WIDTH + TIMEPOINT_GAP * THEME_UNIT));
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

  const timepointDisplayCount = Math.ceil(width / (TIMEPOINT_WIDTH + TIMEPOINT_GAP * THEME_UNIT));
  const miniMapSections = minimapSections(timepoints, timepointDisplayCount, viewTimeRangeTo);
  const activeSection = findActiveSection(miniMapSections, viewTimeRangeTo);

  const handleTimeRangeToInViewChange = useCallback((timeRangeToInView: UnixTimestamp) => {
    setViewTimeRangeTo(timeRangeToInView);
  }, []);

  return {
    handleTimeRangeToInViewChange,
    ref,
    timepointDisplayCount,
    viewTimeRangeTo,
    width,
    miniMapSections,
    activeSection,
  };
}

interface UseTimepointExplorerProps {
  timeRange: TimeRange;
  check: Check;
}

export function useTimepointExplorer({ timeRange, check }: UseTimepointExplorerProps) {
  const { data: checkConfigs = [] } = useCheckConfigs({ timeRange, check });
  const timepointsInRange = useTimepointsInRange({
    from: timeRange.from.valueOf(),
    to: timeRange.to.valueOf(),
    checkConfigs,
  });

  const {
    fetchNextPage,
    hasNextPage,
    data: logsData = [],
  } = useInfiniteLogs<CheckLabel, CheckLabelType>({
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

  const builtConfigs = configTimeRanges(checkConfigs, timeRange.to.valueOf());
  console.log(builtConfigs);
  const timepoints = logsData.reduce<Timepoints>((acc, log) => {
    const frequency = builtConfigs.find((c) => log.Time >= c.from && log.Time < c.to)?.frequency;

    if (!frequency) {
      // should be impossible
      console.log('No frequency found for log', log);
      return acc;
    }

    const adjustedTime = timeshiftedTimepoint(log.Time, frequency) + frequency;
    const { probe } = log.labels;

    if (!acc[adjustedTime]) {
      acc[adjustedTime] = {};
    }

    acc[adjustedTime][probe] = {
      ...log,
      frequency,
    };

    return acc;
  }, timepointsInRange);

  return timepoints;
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
      const res = data[REF_ID_UNIQUE_CHECK_CONFIGS];
      return extractFrequenciesAndConfigs(res);
    },
  });
}

const NANOSECONDS_PER_MILLISECOND = 1000000;

function extractFrequenciesAndConfigs(data: DataFrame[]) {
  let build: Array<{ frequency: number; date: UnixTimestamp }> = [];

  for (const frame of data) {
    const Value = frame.fields[1];

    if (Value.labels) {
      const { config_version, frequency } = Value.labels;
      const toUnixTimestamp = Math.round(Number(config_version) / NANOSECONDS_PER_MILLISECOND);
      const date: UnixTimestamp = toUnixTimestamp;

      build.push({
        frequency: Number(frequency),
        date,
      });
    }
  }

  return build;
}
interface UseTimepointsInRangeProps {
  from: UnixTimestamp;
  to: UnixTimestamp;
  checkConfigs: Array<{ frequency: number; date: UnixTimestamp }>;
}

function useTimepointsInRange({ from, to, checkConfigs }: UseTimepointsInRangeProps) {
  const rangeFrom = from;
  const rangeTo = to;

  // work backwards
  let configs = [...checkConfigs];

  // start with the latest config
  let currentConfig = configs.pop();

  // mutate for efficiency
  let build: Record<UnixTimestamp, {}> = {};

  if (!currentConfig) {
    return build;
  }

  // remove non-full frequency timepoints
  let currentTimepoint = timeshiftedTimepoint(rangeTo, currentConfig.frequency);

  while (currentTimepoint > rangeFrom && currentConfig) {
    const currentFrequency = currentConfig.frequency;
    const uptoDate = currentTimepoint - (currentTimepoint % currentFrequency);

    for (let i = uptoDate; i <= currentTimepoint; i += currentFrequency) {
      build[i] = {};
    }

    currentTimepoint = uptoDate - currentFrequency;

    if (currentTimepoint.valueOf() < currentConfig.date.valueOf()) {
      currentConfig = configs.pop();
    }
  }

  return build;
}
