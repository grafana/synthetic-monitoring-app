import { useMemo } from 'react';
import { formatProbeMatcher } from 'dashboards/query/interpolate';
import { useDashboardLegacyVarsOptional } from 'dashboards/runtime/DashboardLegacyRuntime';

import { Check } from 'types';
import { useCheckDashboardOptional } from 'contexts/CheckDashboardProvider';
import { useDashboardPanelScopeOptional } from 'contexts/DashboardPanelScopeProvider';
import { useProbes } from 'data/useProbes';

/**
 * Dashboard variable values for panels and Timepoint Explorer.
 * CheckDashboard-first when mounted; falls back to legacy runtime vars on Scene dashboards.
 */
export function useDashboardVar(name: string): string[] {
  const checkDashboard = useCheckDashboardOptional();
  const panelScope = useDashboardPanelScopeOptional();
  const legacyVars = useDashboardLegacyVarsOptional();

  if (checkDashboard) {
    if (name === 'probe') {
      return panelScope?.probes.length ? panelScope.probes : ['.*'];
    }

    if (name === 'job') {
      return [checkDashboard.check.job];
    }

    if (name === 'instance') {
      return [checkDashboard.check.target];
    }
  }

  if (legacyVars) {
    if (name === 'probe') {
      return legacyVars.probe;
    }

    if (name === 'job') {
      return legacyVars.job;
    }

    if (name === 'instance') {
      return legacyVars.instance;
    }
  }

  return ['.*'];
}

export function useDashboardVarProbes(check: Check): string[] {
  const probe = useDashboardVar('probe');
  const { data = [], isLoading } = useProbes();

  const probeNames = useMemo(() => {
    return check.probes
      .reduce<string[]>((acc, id) => {
        const configuredProbe = data.find((entry) => entry.id === id);

        if (configuredProbe) {
          acc.push(configuredProbe.name);
        }

        return acc.sort((a, b) => a.localeCompare(b));
      }, []);
  }, [check.probes, data]);

  if (isLoading) {
    return probe;
  }

  if (probe.includes('.*')) {
    return probeNames.sort((a, b) => a.localeCompare(b));
  }

  return probe.sort((a, b) => a.localeCompare(b));
}

export function formatDashboardProbeMatcher(probes: string[]): string {
  return formatProbeMatcher(probes);
}
