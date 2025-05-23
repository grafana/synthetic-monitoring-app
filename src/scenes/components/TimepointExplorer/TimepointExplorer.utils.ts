import { DataFrame } from '@grafana/data';

import { CheckEndedLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { MinimapSection, Timepoint, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function minimapSections(timepoints: Timepoint[], timePointsToDisplay: number, viewTimeRangeTo: UnixTimestamp) {
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
      active: timestampTo === viewTimeRangeTo,
    };

    sections.push(section);
  }

  return sections;
}

export function findActiveSection(sections: MinimapSection[], timeRangeTo: UnixTimestamp) {
  return sections.find((section) => timeRangeTo >= section.from && timeRangeTo <= section.to);
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

  return percentage;
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
        return timepoint;
      }

      const timepointDuration = timepoint.adjustedTime - previousTimepoint.adjustedTime;

      return { ...timepoint, timepointDuration };
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
      index: 0,
      maxProbeDuration: -1,
    });

    currentTimepoint -= config.frequency;
  }

  return build;
}

const NANOSECONDS_PER_MILLISECOND = 1000000;

export function extractFrequenciesAndConfigs(data: DataFrame) {
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
