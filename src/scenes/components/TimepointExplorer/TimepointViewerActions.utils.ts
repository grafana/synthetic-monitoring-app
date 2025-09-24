import { StatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function getProbeNameToUse(probeVar: string[], statefulTimepoint?: StatefulTimepoint) {
  if (statefulTimepoint) {
    return Object.keys(statefulTimepoint.probeResults).sort((a, b) => a.localeCompare(b))[0];
  }

  return probeVar.sort((a, b) => a.localeCompare(b))[0];
}
