import { MinimapSection } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function minimapSections(timepointsInRange: Date[], timePointsToDisplay: number) {
  const sections: MinimapSection[] = [];

  if (timePointsToDisplay === 0) {
    return sections;
  }

  for (let i = 0; i < timepointsInRange.length; i += timePointsToDisplay) {
    const timepoints = timepointsInRange.slice(i, i + timePointsToDisplay);

    const section = {
      to: timepoints[0],
      from: timepoints[timepoints.length - 1],
      index: i,
      timepoints,
    };

    sections.push(section);
  }

  return sections;
}

export function findClosestSection(sections: MinimapSection[], timeRangeTo: Date) {
  return sections.find((section) => timeRangeTo >= section.from && timeRangeTo <= section.to);
}

export function timeshiftedTimepoint(unixDate: number, frequency: number) {
  return unixDate - (unixDate % frequency);
}
