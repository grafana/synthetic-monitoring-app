import { DataFrame } from '@grafana/data';
import { difference } from 'lodash';

import {
  EndingLogLabels,
  ExecutionLabels,
  ExecutionLabelType,
  UnknownExecutionLog,
} from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import {
  ANNOTATION_COLOR_CHECK_UPDATED,
  ANNOTATION_COLOR_NO_DATA,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  CheckConfig,
  CheckConfigRaw,
  CheckEvent,
  CheckEventType,
  MiniMapPage,
  MiniMapPages,
  MiniMapSection,
  MiniMapSections,
  ProbeResults,
  SelectedState,
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointStatus,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function getTimeAdjustedTimepoint(unixDate: UnixTimestamp, frequency: number): UnixTimestamp {
  return unixDate - (unixDate % frequency);
}

// needed?
export function buildConfigTimeRanges(checkConfigs: CheckConfigRaw[], timeRangeTo: UnixTimestamp): CheckConfig[] {
  return checkConfigs.map(({ date, frequency, type }, i) => {
    const from = date;
    const nextConfig = checkConfigs[i + 1];

    return {
      frequency,
      from,
      to: nextConfig ? nextConfig.date : timeRangeTo,
      type,
    };
  });
}

export function getTimepointStatus(probeResults: ProbeResults): TimepointStatus {
  const executions = Object.values(probeResults)
    .flat()
    .map((execution) => execution[LokiFieldNames.Labels].probe_success);

  return executions.every((execution) => execution === '0') ? 'failure' : 'success';
}

export function getMaxProbeDuration(probeResults: ProbeResults) {
  const executionDurations = Object.values(probeResults)
    .flat()
    .map((execution) => Number(execution[LokiFieldNames.Labels].duration_seconds) * 1000);

  return Math.max(...executionDurations);
}

export function getEntryHeight(duration: number, maxProbeDurationData: number) {
  const percentage = (duration / maxProbeDurationData) * 100;

  // TODO: fix this at the root of the problem
  return percentage > 100 ? 100 : percentage;
}

export function getEntryHeightPx(duration: number, maxProbeDurationData: number, containerHeightPx: number) {
  const percentage = getEntryHeight(duration, maxProbeDurationData);
  const inPx = containerHeightPx * (percentage / 100);

  return inPx;
}

interface BuildTimepointsInRangeProps {
  from: UnixTimestamp;
  checkConfigs: CheckConfig[];
}

export function buildTimepoints({ from, checkConfigs }: BuildTimepointsInRangeProps): StatelessTimepoint[] {
  const startTime = performance.now();

  const timepoints = checkConfigs.map((config) => {
    const configFrom = from > config.from ? from : config.from;
    const configTo = config.to;

    return buildTimepointsForConfig({ from: configFrom, to: configTo, config });
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

  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`buildTimepoints executed in ${duration.toFixed(2)} milliseconds`);

  return res;
}

interface BuildTimepointsForConfigProps {
  from: UnixTimestamp;
  to: UnixTimestamp;
  config: CheckConfig;
}

export function buildTimepointsForConfig({ from, to, config }: BuildTimepointsForConfigProps) {
  let build: Array<Omit<StatelessTimepoint, 'index'>> = [];
  let currentTimepoint = getTimeAdjustedTimepoint(to, config.frequency);

  while (currentTimepoint >= from) {
    build.push({
      adjustedTime: currentTimepoint,
      timepointDuration: config.frequency,
      config,
    });

    currentTimepoint -= config.frequency;
  }

  return build;
}

const NANOSECONDS_PER_MILLISECOND = 1000000;

export function extractFrequenciesAndConfigs(data: DataFrame) {
  let build: CheckConfigRaw[] = [];
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
  checkConfigs,
  checkCreation,
  logsRetentionFrom,
}: {
  checkConfigs: CheckConfig[];
  checkCreation: UnixTimestamp;
  logsRetentionFrom: UnixTimestamp;
}): CheckEvent[] {
  const checkCreatedDate = Math.round(checkCreation * 1000);
  const upto = Math.max(logsRetentionFrom, checkCreatedDate);

  const noDataEvents = checkConfigs
    .filter((config) => config.type === 'no-data')
    .map<CheckEvent>((config) => ({
      label: CheckEventType.NO_DATA,
      from: config.from,
      to: config.to,
      color: ANNOTATION_COLOR_NO_DATA,
    }));

  const checkUpdatedEvents = checkConfigs
    .filter((config) => config.from > upto)
    .map<CheckEvent>((config) => ({
      label: CheckEventType.CHECK_UPDATED,
      from: config.from,
      to: config.from,
      color: ANNOTATION_COLOR_CHECK_UPDATED,
    }));

  return [...checkUpdatedEvents, ...noDataEvents];
}

export function getMiniMapPages(
  timepointsLength: number,
  timepointsDisplayCount: number,
  maxSections: number
): MiniMapPages {
  if (!timepointsLength) {
    return [[0, 0]];
  }

  if (!timepointsDisplayCount) {
    return [[timepointsLength - timepointsDisplayCount - 1, timepointsLength - 1]];
  }

  const pages = [];
  const withSections = timepointsDisplayCount * maxSections;

  // Start from the end and work backwards to get most recent pages first
  let remainingTimepoints = timepointsLength;

  while (remainingTimepoints > 0) {
    const endIndex = remainingTimepoints - 1;
    const startIndex = Math.max(0, remainingTimepoints - withSections);
    pages.push([startIndex, endIndex]);

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
  return timepoints.slice(start, end + 1);
}

export function getVisibleTimepointsTimeRange({ timepoints }: { timepoints: StatelessTimepoint[] }) {
  const timepointTo = timepoints[timepoints.length - 1];
  const timepointFrom = timepoints[0];
  const timeRangeTo = timepointTo?.adjustedTime + timepointTo?.timepointDuration * 2;
  const timeRangeFrom = timepointFrom?.adjustedTime;

  return {
    from: timeRangeFrom,
    to: timeRangeTo,
  };
}

interface BuildLogsMapProps {
  logs: Array<ParsedLokiRecord<ExecutionLabels & EndingLogLabels, ExecutionLabelType>>;
  timepoints: StatelessTimepoint[];
  check: Check;
}

export function buildLogsMap({ logs, timepoints, check }: BuildLogsMapProps) {
  return logs.reduce<Record<UnixTimestamp, StatefulTimepoint>>((acc, log) => {
    const duration = log.labels.duration_seconds ? Number(log.labels.duration_seconds) * 1000 : 0;
    const startingTime = log.Time - duration;

    // not efficient, but somewhat migrated by just using visible timepoints to limit the work
    const timepoint = timepoints.find(
      (t: StatelessTimepoint) => startingTime >= t.adjustedTime && startingTime <= t.adjustedTime + t.timepointDuration
    );

    if (!timepoint) {
      return acc;
    }

    const timeshiftedStartingTime = getTimeAdjustedTimepoint(startingTime, check.frequency);
    const existingProbeResults = acc[timeshiftedStartingTime]?.probeResults || {};
    const executionProbeName = log.labels.probe;
    const existingProbeResultsForProbe = existingProbeResults[executionProbeName] || [];

    const probeResults = {
      ...existingProbeResults,
      [executionProbeName]: [...existingProbeResultsForProbe, log],
    };

    const status = getTimepointStatus(probeResults);

    acc[timeshiftedStartingTime] = {
      adjustedTime: timepoint.adjustedTime,
      timepointDuration: timepoint.timepointDuration,
      config: timepoint.config,
      probeResults,
      status,
      maxProbeDuration: getMaxProbeDuration(probeResults),
      index: timepoint.index,
    };

    return acc;
  }, {});
}

export function findNearest(pages: MiniMapPages | MiniMapSections, currentRange: MiniMapPage | MiniMapSection) {
  let bestPageIndex = 0;
  let maxOverlap = 0;

  pages.forEach((page, index) => {
    // Calculate overlap between page range and current range
    const overlapStart = Math.max(page[0], currentRange[0]);
    const overlapEnd = Math.min(page[1], currentRange[1]);

    // If there's overlap, calculate the number of overlapping indices
    const overlap = overlapStart <= overlapEnd ? overlapEnd - overlapStart + 1 : 0;

    // Update best page if this one has more overlap, or same overlap but higher index (newer)
    if (overlap > maxOverlap || (overlap === maxOverlap && index > bestPageIndex)) {
      maxOverlap = overlap;
      bestPageIndex = index;
    }
  });

  return bestPageIndex;
}

export function getIsTimepointSelected(timepoint: StatelessTimepoint, selectedTimepoint: SelectedState) {
  const [timepointToView] = selectedTimepoint;
  const isTimepointSelected = timepointToView?.adjustedTime === timepoint.adjustedTime;

  return isTimepointSelected;
}

export function getIsProbeSelected(timepoint: StatelessTimepoint, probeName: string, selectedTimepoint: SelectedState) {
  const [_, probeNameToView] = selectedTimepoint;
  const isTimepointSelected = getIsTimepointSelected(timepoint, selectedTimepoint);
  const isExecutionSelected = probeName === probeNameToView;
  const isSelected = isTimepointSelected && isExecutionSelected;

  return isSelected;
}

interface GetPendingResultsProps {
  statefulTimepoint: StatefulTimepoint;
  selectedProbeNames: string[];
}

export function getPendingProbeNames({ statefulTimepoint, selectedProbeNames }: GetPendingResultsProps): string[] {
  if (!statefulTimepoint) {
    return selectedProbeNames;
  }

  const entryProbeNames = Object.keys(statefulTimepoint.probeResults);
  const pendingProbes = getPendingProbes({ entryProbeNames, selectedProbeNames });
  const isResultPending = Boolean(pendingProbes.length);

  return isResultPending ? pendingProbes : [];
}

export function getPendingProbes({
  entryProbeNames,
  selectedProbeNames,
}: {
  entryProbeNames: string[];
  selectedProbeNames: string[];
}) {
  return difference(selectedProbeNames, entryProbeNames);
}

export function getIsCheckCreationWithinTimerange(checkCreation: number, timepoints: StatelessTimepoint[]) {
  const checkCreationDate = Math.round(checkCreation * 1000);
  const { adjustedTime, timepointDuration } = timepoints[0] || {};

  return checkCreationDate >= adjustedTime - timepointDuration;
}

export function getIsInTheFuture(timepoint: StatelessTimepoint, currentAdjustedTime: UnixTimestamp) {
  return timepoint.adjustedTime > currentAdjustedTime;
}

export function getProbeExecutionsStatus(
  executionLog: UnknownExecutionLog | undefined,
  pendingProbeNames: string[],
  probeName: string
): TimepointStatus {
  if (!executionLog) {
    if (pendingProbeNames.includes(probeName)) {
      return 'pending';
    }

    return 'missing';
  }

  const probeStatus = executionLog[LokiFieldNames.Labels]?.probe_success;
  const isSuccess = probeStatus === '1';

  return isSuccess ? 'success' : 'failure';
}

export function getCouldBePending(timepoint: StatelessTimepoint, currentAdjustedTime: UnixTimestamp) {
  // the previous timepoint could also be pending.
  // e.g. if a check is running every minute and takes 30 seconds to complete
  // if it begins at 10:00:59, it will complete at 10:01:29
  // so even though the 'current' timepoint is 10:01:00 we are waiting on the result of the previous timepoint, too
  const possibilities = [currentAdjustedTime - timepoint.timepointDuration, currentAdjustedTime];

  return possibilities.includes(timepoint.adjustedTime);
}

interface GetTimeFromProps {
  checkCreation: UnixTimestamp;
  logsRetentionFrom: UnixTimestamp;
  timeRangeFrom: UnixTimestamp;
}

export function getTimeFrom({ checkCreation, logsRetentionFrom, timeRangeFrom }: GetTimeFromProps) {
  const checkCreationDate = Math.round(checkCreation * 1000);
  // get oldest
  const creationOrRetention = Math.min(checkCreationDate, logsRetentionFrom);

  // get newest
  return Math.max(creationOrRetention, timeRangeFrom);
}
