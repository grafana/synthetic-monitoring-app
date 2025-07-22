import { DataFrame } from '@grafana/data';

import { CheckEndedLog, CheckLabels, CheckLabelType, EndingLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { MAX_MINIMAP_SECTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  Annotation,
  CheckConfig,
  CheckEvent,
  CheckEventType,
  MinimapSection,
  Timepoint,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function minimapSections(timepoints: Timepoint[], timePointsToDisplay: number) {
  const timepointsInRange = timepoints.map((t) => t.adjustedTime);
  const sections: MinimapSection[] = [];

  if (timePointsToDisplay === 0) {
    return sections;
  }

  for (let i = 0; i < timepointsInRange.length; i += timePointsToDisplay) {
    const fromIndex = i;
    const toIndex = i + timePointsToDisplay;
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

export function calculateUptimeValue(probes: CheckEndedLog[]) {
  if (probes.length === 0) {
    return -1;
  }

  return probes.every((probe) => probe[LokiFieldNames.Labels].probe_success === '0') ? 0 : 1;
}

export function getMaxProbeDuration(probes: CheckEndedLog[]) {
  return probes.reduce((acc, curr) => {
    const duration = Math.round(Number(curr[LokiFieldNames.Labels].duration_seconds) * 1000);

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
  let build: Timepoint[] = [];
  let currentTimepoint = timeshiftedTimepoint(to, config.frequency);

  while (currentTimepoint >= from) {
    build.push({
      probes: [],
      uptimeValue: -1,
      adjustedTime: currentTimepoint,
      timepointDuration: config.frequency,
      frequency: config.frequency,
      index: -1,
      maxProbeDuration: -1,
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
  timepoints: Timepoint[];
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

interface TimepointsWithLogsProps {
  timepoints: Timepoint[];
  logs: Array<ParsedLokiRecord<CheckLabels & EndingLogLabels, CheckLabelType>>;
  timeRangeFrom: UnixTimestamp;
  timeRangeTo: UnixTimestamp;
}

export function combineTimepointsWithLogs({ timepoints, logs, timeRangeFrom, timeRangeTo }: TimepointsWithLogsProps) {
  const copy = [...timepoints]; // necessary?

  logs.forEach((log) => {
    const duration = log.labels.duration_seconds ? Number(log.labels.duration_seconds) * 1000 : 0;
    const startingTime = log.Time - duration;

    const timepoint = [...copy] // necessary?
      .reverse()
      .find((t) => startingTime >= t.adjustedTime && startingTime <= t.adjustedTime + t.timepointDuration); // not very efficient

    if (!timepoint) {
      console.log('No timepoint found for log -- probably out of selected time range', {
        log,
        id: log.id,
        timeRangeFrom,
        timeRangeTo,
      });
      return;
    }

    // deduplicate logs
    if (!timepoint.probes.find((p) => p.id === log.id)) {
      timepoint.probes.push(log);
    }

    timepoint.uptimeValue = calculateUptimeValue(timepoint.probes);
    timepoint.maxProbeDuration = getMaxProbeDuration(timepoint.probes);
  });

  const reversedTimepoints = copy.reverse();
  return reversedTimepoints;
}

interface GetTimepointExplorerLocalTimeRangeProps {
  timepoints: Timepoint[];
  timepointsToDisplay: number;
  to: UnixTimestamp;
}

export function getVisibleTimepointsFromLocalTimeRange({
  timepoints,
  timepointsToDisplay,
  to,
}: GetTimepointExplorerLocalTimeRangeProps) {
  const entries = timepointsToDisplay * MAX_MINIMAP_SECTIONS;

  if (entries > timepoints.length) {
    return timepoints;
  }

  const timepointsInRange = timepoints.filter((t) => t.adjustedTime <= to);
  const fromIndex = timepointsInRange.length - entries;
  const minIndex = Math.max(0, fromIndex);
  return timepointsInRange.slice(minIndex, timepointsInRange.length);
}
