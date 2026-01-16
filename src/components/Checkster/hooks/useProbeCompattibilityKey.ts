import { useMemo } from 'react';

import { ProbeWithMetadata } from 'types';

export function useProbeCompatibilityKey(probes: ProbeWithMetadata[]): string {
  return useMemo(() => {
    return probes
      .map((probe) => {
        const versions = probe.k6Versions ? JSON.stringify(probe.k6Versions) : '';
        return `${probe.id}:${versions}`;
      })
      .join('|');
  }, [probes]);
}
