import { Probe } from 'types';
import { getUserPermissions } from 'data/permissions';

export function useCanEditProbe(probe?: Probe) {
  const { canWriteProbes, canDeleteProbes } = getUserPermissions();

  if (probe?.public) {
    return { canWriteProbes: false, canDeleteProbes: false };
  }

  return { canWriteProbes, canDeleteProbes };
}
