import { useVariables } from '@grafana/scenes-react';

import { useCheckDashboardOptional } from 'contexts/CheckDashboardProvider';

function normalizeProbeValue(value: string[] | undefined): string[] | undefined {
  if (!value?.length) {
    return undefined;
  }

  if (value.includes('$__all')) {
    return ['.*'];
  }

  return value;
}

export function useSceneVar(name: string) {
  const vars = useVariables();
  const checkDashboard = useCheckDashboardOptional();
  const variable = vars.find((v) => v.state.name === name);

  // @ts-expect-error - value is not typed
  const sceneValue = normalizeProbeValue(variable?.state.value as string[] | undefined);

  if (sceneValue) {
    return sceneValue;
  }

  if (checkDashboard) {
    if (name === 'probe') {
      return checkDashboard.probes.length > 0 ? checkDashboard.probes : ['.*'];
    }

    if (name === 'job') {
      return [checkDashboard.check.job];
    }

    if (name === 'instance') {
      return [checkDashboard.check.target];
    }
  }

  return ['.*'];
}
