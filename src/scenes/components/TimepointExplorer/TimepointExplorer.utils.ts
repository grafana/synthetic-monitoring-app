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

  return probes.every((probe) => probe[LokiFieldNames.Labels].probe_success === '1') ? 1 : 0;
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

  return `${percentage}%`;
}
