import { DataFrame } from '@grafana/data';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { MAX_MINIMAP_SECTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  Annotation,
  CheckConfig,
  CheckEvent,
  CheckEventType,
  ExecutionsInTimepoint,
  MinimapSection,
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

export function getMiniMapPages(timepoints: StatelessTimepoint[], timepointsDisplayCount: number) {
  const pages: Array<[number, number]> = [];

  if (!timepoints.length || timepointsDisplayCount === 0) {
    return pages;
  }
  const withSections = timepointsDisplayCount * MAX_MINIMAP_SECTIONS;

  // Start from the end and work backwards to get most recent pages first
  let remainingTimepoints = timepoints.length;

  while (remainingTimepoints > 0) {
    const endIndex = remainingTimepoints;
    const startIndex = Math.max(0, remainingTimepoints - withSections);
    pages.push([startIndex, endIndex]);
    remainingTimepoints = startIndex;
  }

  return pages;
}

export function getMiniMapSections(timepoints: StatelessTimepoint[], timepointsDisplayCount: number) {
  const timepointsInRange = timepoints.map((t) => t.adjustedTime);
  const sections: MinimapSection[] = [];

  if (timepointsDisplayCount === 0) {
    return sections;
  }

  for (let i = 0; i < timepointsInRange.length; i += timepointsDisplayCount) {
    const fromIndex = i;
    const toIndex = i + timepointsDisplayCount;
    const timepoints = timepointsInRange.slice(fromIndex, toIndex);
    const timestampTo = Number(timepoints[0]);
    const timestampFrom = Number(timepoints[timepoints.length - 1]);

    const section = {
      to: timestampTo,
      from: timestampFrom,
      toIndex,
      fromIndex,
      index: i,
    };

    sections.push(section);
  }

  return sections;
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
