import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeRange } from '@grafana/data';
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
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  TIMEPOINT_GAP,
  TIMEPOINT_SIZE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Timepoint, UnixTimestamp, ViewMode } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildTimepoints,
  calculateUptimeValue,
  extractFrequenciesAndConfigs,
  findActiveSection,
  getMaxProbeDuration,
  minimapSections,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

type Size = {
  width?: number;
};

export function useTimepointExplorerView(timepoints: Timepoint[], initialTimeRangeToInView: UnixTimestamp) {
  const ref = useRef<HTMLDivElement>(null);
  // if we just know when the view is to we can anchor the view from that
  const [viewTimeRangeTo, setViewTimeRangeTo] = useState<UnixTimestamp>(initialTimeRangeToInView);
  const [viewMode, setViewMode] = useState<ViewMode>(TIMEPOINT_EXPLORER_VIEW_OPTIONS[0].value);

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

  const timepointsInRange = useMemo(() => buildTimepoints({ from, to, checkConfigs }), [from, to, checkConfigs]);

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

  const timepoints = useMemo(() => {
    const copy = [...timepointsInRange];

    logsData.forEach((log) => {
      const timepoint = [...copy]
        .reverse()
        .find((t) => log.Time <= t.adjustedTime && log.Time >= t.adjustedTime - t.timepointDuration);

      if (!timepoint) {
        // probably out of selected time range
        console.log('No frequency found for log', log);

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
  }, [logsData, timepointsInRange]);

  return useMemo(() => {
    const firstEntry = timepoints[0];

    // assume the first entry didn't look far enough back in time to get the logs associated with it so can be removed
    if (firstEntry?.probes.length === 0) {
      timepoints.shift();
    }

    return timepoints.reverse();
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
      return data.map((d) => extractFrequenciesAndConfigs(d)).flat();
    },
  });
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
      const values = data.map((d) => d.fields[1].values[0]);
      const max = Math.max(...values);
      return Math.round(max * MILLISECONDS_PER_SECOND);
    },
  });

  const data = maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;

  return { data, isLoading };
}
