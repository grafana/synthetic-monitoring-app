import { useMemo } from 'react';

import { useChecksAlertStates } from 'data/useCheckAlertStates';
import { useSuspenseChecks } from 'data/useChecks';
import { useProbesWithMetadata } from 'data/useProbes';
import { useChecksCurrentSuccessRate, useChecksReachabilitySuccessRate, useOverallReachability } from 'data/useSuccessRates';
import { useThresholds } from 'data/useThresholds';
import { isDisplayOnline } from 'components/ProbeCard/ProbeStatus';

import { computeCheckHealth, sortBySeverity, summarizeKpis } from './Home.utils';

export function useHomeStatus() {
  const { data: checks = [] } = useSuspenseChecks();
  const { data: currentSuccessRates, isLoading: isCurrentLoading } = useChecksCurrentSuccessRate();
  const { data: reachabilityRates, isLoading: isReachabilityLoading } = useChecksReachabilitySuccessRate();
  const { data: alertStates } = useChecksAlertStates(checks);
  const { data: tenantSettings } = useThresholds();
  const { data: overallReachability } = useOverallReachability();

  const checkHealth = useMemo(() => {
    return computeCheckHealth({
      checks,
      currentSuccessRates,
      reachabilityRates,
      alertStates,
      reachabilityThreshold: tenantSettings?.thresholds.reachability,
    }).sort(sortBySeverity);
  }, [checks, currentSuccessRates, reachabilityRates, alertStates, tenantSettings]);

  const kpis = useMemo(() => summarizeKpis(checkHealth, checks), [checkHealth, checks]);

  return {
    checks,
    checkHealth,
    kpis,
    overallReachability,
    isMetricsLoading: isCurrentLoading || isReachabilityLoading,
  };
}

export function useProbeHealth() {
  const { data: probes = [], isLoading } = useProbesWithMetadata();

  const offlineProbes = useMemo(() => probes.filter((probe) => !isDisplayOnline(probe)), [probes]);

  return {
    probes,
    offlineProbes,
    isLoading,
  };
}
