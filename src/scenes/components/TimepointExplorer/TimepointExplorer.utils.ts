import { MinimapSection, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function minimapSections(
  timepointsInRange: UnixTimestamp[],
  timePointsToDisplay: number,
  viewTimeRangeTo: UnixTimestamp
) {
  const sections: MinimapSection[] = [];

  if (timePointsToDisplay === 0) {
    return sections;
  }

  for (let i = 0; i < timepointsInRange.length; i += timePointsToDisplay) {
    const fromIndex = i;
    const toIndex = i + timePointsToDisplay;
    const timepoints = timepointsInRange.slice(fromIndex, toIndex);

    const section = {
      to: timepoints[0],
      from: timepoints[timepoints.length - 1],
      toIndex,
      fromIndex,
      active: timepoints[0] === viewTimeRangeTo,
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
