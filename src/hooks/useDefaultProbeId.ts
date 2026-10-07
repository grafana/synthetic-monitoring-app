import { useRef } from 'react';

import { CheckType, ProbeWithMetadata } from 'types';
import { getAvailableProbes } from 'components/CheckEditor/ProbeOptions';

function getDefaultProbeId(probes: ProbeWithMetadata[], checkType: CheckType) {
  const availableProbes = getAvailableProbes(probes, checkType).filter((probe) => !probe.deprecated);
  const onlineProbes = availableProbes.filter((probe) => probe.online);
  const defaultProbe = onlineProbes.find((probe) => probe.public) ?? onlineProbes[0] ?? availableProbes[0];

  return defaultProbe?.id;
}

// Picked once per checkType and then left alone: probes refetch every 10s, and re-deriving
// this from live online status on every poll would silently swap the preselected probe out
// from under the user while they're still filling in the form.
export function useDefaultProbeId(probesWithMetadata: ProbeWithMetadata[], checkType: CheckType) {
  const lockedRef = useRef<{ checkType: CheckType; probeId: number | undefined } | undefined>(undefined);

  if (!lockedRef.current || lockedRef.current.checkType !== checkType) {
    lockedRef.current = { checkType, probeId: getDefaultProbeId(probesWithMetadata, checkType) };
  } else if (lockedRef.current.probeId === undefined) {
    lockedRef.current.probeId = getDefaultProbeId(probesWithMetadata, checkType);
  }

  return lockedRef.current.probeId;
}
