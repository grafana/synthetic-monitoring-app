import { Probe } from 'types';

import { useCanWriteSM } from './useDSPermission';

export function useCanEditProbe(probe?: Probe) {
  const canEdit = useCanWriteSM();

  if (!probe) {
    return canEdit;
  }

  return canEdit && !probe.public;
}
