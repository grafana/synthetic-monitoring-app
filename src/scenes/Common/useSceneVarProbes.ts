import { useMemo } from 'react';

import { Check } from 'types';
import { useProbes } from 'data/useProbes';
import { useSceneVar } from 'scenes/Common/useSceneVar';

export function useSceneVarProbes(check: Check) {
  const probe = useSceneVar('probe');
  const { data = [], isLoading } = useProbes();

  const probeNames = useMemo(() => {
    return check.probes.reduce<string[]>((acc, id) => {
      const probe = data.find((probe) => probe.id === id);
      if (probe) {
        acc.push(probe.name);
      }
      return acc;
    }, []);
  }, [data, check.probes]);

  if (isLoading) {
    return probe;
  }

  if (probe.includes('.*')) {
    return probeNames;
  }

  return probe;
}
