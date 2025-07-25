import { DataFrame } from '@grafana/data';

import { CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { MAX_MINIMAP_SECTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  Annotation,
  CheckConfig,
  CheckEvent,
  CheckEventType,
  ExecutionsInTimepoint,
  MiniMapPage,
  MiniMapPages,
  MiniMapSection,
  MiniMapSections,
  StatefulTimepoint,
  StatelessTimepoint,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function timeshiftedTimepoint(unixDate: UnixTimestamp, frequency: number): UnixTimestamp {
  return unixDate - (unixDate % frequency);
}

// needed?
export function configTimeRanges(
  checkConfigs: Array<{ frequency: number; date: UnixTimestamp }>,
  timeRangeTo: UnixTimestamp
) {
  return checkConfigs.map(({ date, frequency }, i) => {
    const from = date;
    const nextConfig = checkConfigs[i + 1];

    return {
      frequency,
      from,
      to: nextConfig ? nextConfig.date : timeRangeTo,
    };
  });
}

export function calculateUptimeValue(executions: ExecutionsInTimepoint[]) {
  if (executions.length === 0) {
    return -1;
  }

  return executions.every((execution) => execution.execution[LokiFieldNames.Labels].probe_success === '0') ? 0 : 1;
}

export function getMaxProbeDuration(executions: ExecutionsInTimepoint[]) {
  return executions.reduce((acc, curr) => {
    const duration = Math.round(Number(curr.execution[LokiFieldNames.Labels].duration_seconds) * 1000);

    if (duration > acc) {
      return duration;
    }

    return acc;
  }, 0);
}

export function getEntryHeight(duration: number, maxProbeDurationData: number) {
  const percentage = (duration / maxProbeDurationData) * 100;

  // TODO: fix this at the root of the problem
  return percentage > 100 ? 100 : percentage;
}

interface BuildTimepointsInRangeProps {
  from: UnixTimestamp;
  to: UnixTimestamp;
  checkConfigs: Array<{ frequency: number; date: UnixTimestamp }>;
}

export function buildTimepoints({ from, to, checkConfigs }: BuildTimepointsInRangeProps) {
  const configsToAndFrom = configTimeRanges(checkConfigs, to);

  const timepoints = configsToAndFrom.map((config) => {
    return buildTimepointsForConfig({ from: from > config.from ? from : config.from, to: config.to, config });
  });

  const flatTimepoints = timepoints.flat();

  const res = flatTimepoints
    .sort((a, b) => a.adjustedTime - b.adjustedTime)
    .map((timepoint, i) => {
      const previousTimepoint = flatTimepoints[i - 1];

      if (!previousTimepoint) {
        return { ...timepoint, index: i };
      }

      const timepointDuration = timepoint.adjustedTime - previousTimepoint.adjustedTime;

      return { ...timepoint, timepointDuration, index: i };
    });

  return res;
}

interface BuildTimepointsForConfigProps {
  from: UnixTimestamp;
  to: UnixTimestamp;
  config: { frequency: number; from: UnixTimestamp; to: UnixTimestamp };
}

export function buildTimepointsForConfig({ from, to, config }: BuildTimepointsForConfigProps) {
  let build: StatelessTimepoint[] = [];
  let currentTimepoint = timeshiftedTimepoint(to, config.frequency);

  while (currentTimepoint >= from) {
    build.push({
      adjustedTime: currentTimepoint,
      timepointDuration: config.frequency,
      frequency: config.frequency,
    });

    currentTimepoint -= config.frequency;
  }

  return build;
}

const NANOSECONDS_PER_MILLISECOND = 1000000;

export function extractFrequenciesAndConfigs(data: DataFrame) {
  let build: CheckConfig[] = [];
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

export function constructCheckEvents({
  timeRangeFrom,
  checkConfigs,
  checkCreation = -1,
}: {
  timeRangeFrom: UnixTimestamp;
  checkConfigs: Array<{ frequency: number; date: UnixTimestamp }>;
  checkCreation?: UnixTimestamp;
}): CheckEvent[] {
  // const OUT_OF_RETENTION = {
  //   label: `Out of retention`,
  //   from: -1,
  //   to: timeRangeFrom,
  //   type: 'range',
  // } as const;

  const checkCreatedDate = Math.round(checkCreation * 1000);

  const CHECK_CREATED = {
    label: CheckEventType.CHECK_CREATED,
    from: checkCreatedDate,
    to: checkCreatedDate,
  };

  return [
    CHECK_CREATED,
    ...checkConfigs
      .filter((config) => config.date > checkCreatedDate)
      .map<CheckEvent>((config) => ({
        label: CheckEventType.CHECK_UPDATED,
        from: config.date,
        to: config.date,
      })),
  ];
}

interface GenerateAnnotationsProps {
  checkEvents: CheckEvent[];
  timepoints: StatelessTimepoint[];
}

export function generateAnnotations({ checkEvents, timepoints }: GenerateAnnotationsProps): Annotation[] {
  let build: Annotation[] = [];

  checkEvents.forEach((checkEvent) => {
    const annotationStartIndex = timepoints.findIndex((timepoint) => {
      const timepointFrom = timepoint.adjustedTime - timepoint.timepointDuration;
      const timepointTo = timepoint.adjustedTime;

      return checkEvent.from >= timepointFrom && checkEvent.from <= timepointTo;
    });

    const annotationEndIndex = timepoints.findIndex((timepoint) => {
      const timepointFrom = timepoint.adjustedTime - timepoint.timepointDuration;
      const timepointTo = timepoint.adjustedTime;

      return checkEvent.to >= timepointFrom && checkEvent.to <= timepointTo;
    });

    const isAnnotationStartInRange = annotationStartIndex !== -1;
    const isAnnotationEndInRange = annotationEndIndex !== -1;

    if (isAnnotationStartInRange || isAnnotationEndInRange) {
      const startIndex = isAnnotationStartInRange ? annotationStartIndex : 0;
      const endIndex = isAnnotationEndInRange ? annotationEndIndex : timepoints.length - 1;

      build.push({
        checkEvent,
        timepointStart: timepoints[startIndex],
        timepointEnd: timepoints[endIndex],
      });
    }
  });

  return build;
}

export function getMaxVisibleMinimapTimepoints(timepointsDisplayCount: number) {
  return timepointsDisplayCount * MAX_MINIMAP_SECTIONS;
}

export function getMiniMapPages(timepoints: StatelessTimepoint[], timepointsDisplayCount: number): MiniMapPages {
  if (!timepoints.length) {
    return [[0, 0]];
  }

  const pages = [];
  const withSections = timepointsDisplayCount * MAX_MINIMAP_SECTIONS;

  // Start from the end and work backwards to get most recent pages first
  let remainingTimepoints = timepoints.length;

  while (remainingTimepoints > 0) {
    const endIndex = remainingTimepoints - 1;
    const startIndex = Math.max(0, remainingTimepoints - withSections - 1);

    if (timepoints[startIndex] && timepoints[endIndex]) {
      pages.push([startIndex, endIndex]);
    }

    remainingTimepoints = startIndex;
  }

  return pages as MiniMapPages;
}

export function getMiniMapSections(miniMapPage: MiniMapPage, timepointsDisplayCount: number): MiniMapSections {
  if (miniMapPage[0] === miniMapPage[1]) {
    return [[miniMapPage[0], miniMapPage[1]]] as MiniMapSections;
  }

  const sections: MiniMapSection[] = [];
  const [pageStartIndex, pageEndIndex] = miniMapPage;
  const totalItems = pageEndIndex - pageStartIndex + 1; // +1 because ranges are inclusive

  if (totalItems <= timepointsDisplayCount) {
    return [[pageStartIndex, pageEndIndex]] as MiniMapSections;
  }

  let currentEnd = pageEndIndex;

  while (currentEnd >= pageStartIndex) {
    let sectionSize = Math.min(timepointsDisplayCount, currentEnd - pageStartIndex + 1);
    const currentStart = currentEnd - sectionSize + 1;

    if (currentStart < pageStartIndex) {
      break;
    }

    sections.push([currentStart, currentEnd]);
    currentEnd = currentStart - 1;
  }

  return sections as MiniMapSections;
}

interface GetVisibleTimepointsProps {
  timepoints: StatelessTimepoint[];
  miniMapCurrentPage: number;
  miniMapPages: Array<[number, number]>;
}

export function getVisibleTimepoints({ timepoints, miniMapCurrentPage, miniMapPages }: GetVisibleTimepointsProps) {
  const [start, end] = miniMapPages[miniMapCurrentPage] || [0, timepoints.length];
  return timepoints.slice(start, end);
}

export function getVisibleTimepointsTimeRange({ timepoints }: { timepoints: StatelessTimepoint[] }) {
  const timepointTo = timepoints[timepoints.length - 1];
  const timepointFrom = timepoints[0];
  const timeRangeTo = timepointTo?.adjustedTime + timepointTo?.timepointDuration;
  const timeRangeFrom = timepointFrom?.adjustedTime;

  return {
    from: timeRangeFrom,
    to: timeRangeTo,
  };
}

export function buildLogsMap(
  logs: Array<ParsedLokiRecord<CheckLabels & EndingLogLabels, CheckLabelType>>,
  timepoints: StatelessTimepoint[],
  check: Check
) {
  return logs.reduce<Record<UnixTimestamp, StatefulTimepoint>>((acc, log) => {
    const duration = log.labels.duration_seconds ? Number(log.labels.duration_seconds) * 1000 : 0;
    const startingTime = log.Time - duration;

    // TODO: this is not efficient, we should find a better way to do this
    // the problem is when a check is updated with a new frequency you get a funny timepoint
    const timepoint = timepoints.find(
      (t: StatelessTimepoint) => startingTime >= t.adjustedTime && startingTime <= t.adjustedTime + t.timepointDuration
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
}
