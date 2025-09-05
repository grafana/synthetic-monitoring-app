import { DataFrame } from '@grafana/data';
import { difference } from 'lodash';

import { ExecutionEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
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
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointStatus,
  UnixTimestamp,
  ViewerState,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function getTimeAdjustedTimepoint(unixDate: UnixTimestamp, frequency: number): UnixTimestamp {
  return unixDate - (unixDate % frequency);
}

export function buildConfigTimeRanges(checkConfigs: CheckConfigRaw[], timeRangeTo: UnixTimestamp): CheckConfig[] {
  return checkConfigs.map(({ date, frequency, type }, i) => {
    const from = date;
    const nextConfig = checkConfigs[i + 1];

    return {
      frequency,
      from,
      to: nextConfig ? nextConfig.date : timeRangeTo + frequency, // this is the current config so ensure we include enough time to get the result
      type,
    };
  });
}

interface BuildTimepointsProps {
  checkConfigs: CheckConfig[];
  limitFrom?: UnixTimestamp;
  limitTo?: UnixTimestamp;
}

export function buildTimepoints({
  checkConfigs,
  limitFrom = 0,
  limitTo = Infinity,
}: BuildTimepointsProps): StatelessTimepoint[] {
  const timepoints = checkConfigs.map((config) => {
    const configFrom = Math.max(limitFrom, config.from);
    const configTo = Math.min(limitTo, config.to);

    return buildTimepointsForConfig({ from: configFrom, to: configTo, config });
  });

  const flatTimepoints = timepoints.flat();

  const res = flatTimepoints
    .sort((a, b) => a.adjustedTime - b.adjustedTime)
    .map((timepoint, i) => {
      return { ...timepoint, index: i };
    });

  return res;
}

interface BuildTimepointsForConfigProps {
  from: UnixTimestamp;
  to: UnixTimestamp;
  config: CheckConfig;
}

export function buildTimepointsForConfig({ from, to, config }: BuildTimepointsForConfigProps) {
  let build: Array<Omit<StatelessTimepoint, 'index'>> = [];
  let currentTimepoint = getTimeAdjustedTimepoint(from, config.frequency);

  while (currentTimepoint < to) {
    const configStartDifference = currentTimepoint < config.from ? currentTimepoint - config.from : 0;
    const configEndDifference =
      currentTimepoint + config.frequency > config.to ? config.to - currentTimepoint : config.frequency;
    const timepointDurationMs = configStartDifference + configEndDifference;
    const timepointDuration = Math.floor(timepointDurationMs / 1000) * 1000;

    build.push({
      adjustedTime: currentTimepoint - configStartDifference,
      timepointDuration,
      config,
    });

    currentTimepoint += config.frequency;
  }

  return build;
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

const NANOSECONDS_PER_MILLISECOND = 1000000;

export function extractFrequenciesAndConfigs(data: DataFrame) {
  let build: CheckConfigRaw[] = [];
  const Value = data.fields?.[1];

  if (Value?.labels) {
    const { config_version, frequency } = Value.labels;
    const toUnixTimestamp = Math.round(Number(config_version) / NANOSECONDS_PER_MILLISECOND);
    const date: UnixTimestamp = Math.ceil(toUnixTimestamp / 1000) * 1000;

    build.push({
      frequency: Number(frequency),
      date,
    });
  }

  return build;
}

export function removeProbableDuplicates(configs: CheckConfigRaw[], tolerance = 1000) {
  // if any check config is within 1 second of another check config, remove the duplicate and keep the newest
  if (!configs?.length) {
    return [];
  }

  const sorted = [...configs].sort((a, b) => a.date - b.date);
  const result: CheckConfigRaw[] = [];

  let clusterLatest: CheckConfigRaw | null = null;

  for (const cfg of sorted) {
    if (!clusterLatest) {
      clusterLatest = cfg;
      continue;
    }

    if (cfg.date - clusterLatest.date <= tolerance) {
      // within tolerance: keep only the newest in the cluster
      clusterLatest = cfg;
    } else {
      // new cluster begins
      result.push(clusterLatest);
      clusterLatest = cfg;
    }
  }

  if (clusterLatest) {
    result.push(clusterLatest);
  }

  return result;
}

export function buildCheckEvents({
  checkConfigs,
  from,
}: {
  checkConfigs: CheckConfig[];
  from: UnixTimestamp;
}): CheckEvent[] {
  const noDataEvents = checkConfigs
    .filter((config) => config.type === 'no-data')
    .map<CheckEvent>((config) => ({
      label: CheckEventType.NO_DATA,
      from: config.from,
      to: config.to,
      color: ANNOTATION_COLOR_NO_DATA,
    }));

  const checkUpdatedEvents = checkConfigs
    .filter((config) => config.from > from)
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

interface BuildlistLogsMapProps {
  logs: ExecutionEndedLog[];
  timepoints: StatelessTimepoint[];
}

export function buildlistLogsMap({ logs, timepoints }: BuildlistLogsMapProps) {
  return logs.reduce<Record<UnixTimestamp, StatefulTimepoint>>((acc, log) => {
    const duration = Number(log.labels.duration_seconds) * 1000;
    const startingTime = log.Time - duration;
    const executionProbeName = log.labels.probe;

    // not efficient, but mitigated by just passing in visible timepoints to limit the calculation
    const timepoint = timepoints.find((t: StatelessTimepoint) => {
      const withinTimepoint = startingTime >= t.adjustedTime && startingTime <= t.adjustedTime + t.timepointDuration;

      if (withinTimepoint) {
        return true;
      }

      return false;
    });

    if (!timepoint) {
      return acc;
    }

    const existingProbeResults = acc[timepoint.adjustedTime]?.probeResults || {};
    const existingProbeResultsForProbe = existingProbeResults[executionProbeName] || [];

    const probeResults = {
      ...existingProbeResults,
      [executionProbeName]: [...existingProbeResultsForProbe, log],
    };

    const status = getTimepointStatus(probeResults);

    acc[timepoint.adjustedTime] = {
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

export function findNearestPageIndex(
  pages: MiniMapPages | MiniMapSections,
  currentRange: MiniMapPage | MiniMapSection
) {
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

export function getIsTimepointSelected(timepoint: StatelessTimepoint, viewerState: ViewerState) {
  const [viewerTimepoint] = viewerState;
  const isTimepointSelected = viewerTimepoint?.adjustedTime === timepoint.adjustedTime;

  return isTimepointSelected;
}

export function getIsProbeBeingViewed(timepoint: StatelessTimepoint, probeName: string, viewerState: ViewerState) {
  const [_, viewerProbeName] = viewerState;
  const isTimepointSelected = getIsTimepointSelected(timepoint, viewerState);
  const isExecutionSelected = probeName === viewerProbeName;
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

export function getIsInTheFuture(timepoint: StatelessTimepoint, currentAdjustedTime: UnixTimestamp) {
  return timepoint.adjustedTime > currentAdjustedTime;
}

export function getCouldBePending(timepoint: StatelessTimepoint, currentAdjustedTime: UnixTimestamp) {
  // the previous timepoint could also be pending.
  // e.g. if a check is running every minute and takes 30 seconds to complete
  // if it begins at 10:00:59, it will complete at 10:01:29
  // so even though the 'current' timepoint is 10:01:00 we are waiting on the result of the previous timepoint, too
  const possibilities = [currentAdjustedTime, currentAdjustedTime - timepoint.timepointDuration];

  return possibilities.includes(timepoint.adjustedTime);
}

interface GetExplorerTimeFromProps {
  checkCreation: UnixTimestamp;
  logsRetentionFrom: UnixTimestamp;
  timeRangeFrom: UnixTimestamp;
}

// if creation was before retention date - then retetention date should be used
// if creation was after retention date - then creation date should be used
// if selected time range is more recent than both - use that
export function getExplorerTimeFrom({ checkCreation, logsRetentionFrom, timeRangeFrom }: GetExplorerTimeFromProps) {
  const wasCreationBeforeRetention = BigInt(checkCreation) < BigInt(logsRetentionFrom);

  if (wasCreationBeforeRetention) {
    return Math.max(logsRetentionFrom, timeRangeFrom);
  }

  return Math.max(checkCreation, timeRangeFrom);
}

export function getYAxisMax(highestValue: number, timeout: number) {
  const nonRoundedYAxisMax = getNonRoundedYAxisMax(highestValue, timeout);
  const roundedYAxisMax = getRoundedYAxisMax(nonRoundedYAxisMax);

  return roundedYAxisMax;
}

export function getRoundedYAxisMax(nonRoundedYAxisMax: number) {
  // Find the next "nice" number that creates clean Y-axis intervals
  // The Y-axis has 5 markers (0, 25%, 50%, 75%, 100%), so we need values that divide nicely by 4
  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(nonRoundedYAxisMax)));
  const normalizedValue = nonRoundedYAxisMax / orderOfMagnitude;

  // Round up to nice numbers that create clean intervals
  let niceValue;
  if (normalizedValue <= 1.0) {
    niceValue = 1.0;
  } else if (normalizedValue <= 1.2) {
    niceValue = 1.2;
  } else if (normalizedValue <= 1.5) {
    niceValue = 1.5;
  } else if (normalizedValue <= 2.0) {
    niceValue = 2.0;
  } else if (normalizedValue <= 2.5) {
    niceValue = 2.5;
  } else if (normalizedValue <= 3.0) {
    niceValue = 3.0;
  } else if (normalizedValue <= 4.0) {
    niceValue = 4.0;
  } else if (normalizedValue <= 5.0) {
    niceValue = 5.0;
  } else if (normalizedValue <= 6.0) {
    niceValue = 6.0;
  } else if (normalizedValue <= 8.0) {
    niceValue = 8.0;
  } else {
    niceValue = 10.0;
  }

  return Math.round(niceValue * orderOfMagnitude);
}

export function getNonRoundedYAxisMax(highestValue: number, timeout: number) {
  if (!highestValue) {
    return 1000; // default it to 1 second
  }

  if (highestValue < timeout && highestValue > timeout * 0.75) {
    return timeout;
  }

  return highestValue;
}

export function getIsCheckCreationWithinRange(checkCreation: UnixTimestamp, from: UnixTimestamp, to: UnixTimestamp) {
  return BigInt(checkCreation) >= BigInt(from) && BigInt(checkCreation) <= BigInt(to);
}

interface GetRenderingStrategyProps {
  isLogsRetentionPeriodWithinTimerange: boolean;
  timepoints: StatelessTimepoint[];
  timepointsDisplayCount: number;
}

export function getRenderingStrategy({
  isLogsRetentionPeriodWithinTimerange,
  timepoints,
  timepointsDisplayCount,
}: GetRenderingStrategyProps) {
  if (timepoints.length > timepointsDisplayCount || isLogsRetentionPeriodWithinTimerange) {
    return 'end';
  }

  return 'start';
}
