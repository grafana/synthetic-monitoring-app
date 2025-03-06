import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { useCheckDrilldownInfo } from 'page/CheckDrilldown/hooks/useCheckDrilldownInfo';

export function useCheckProbeHealth() {
  const { check } = useCheckDrilldown();
  const { timeseries } = useCheckDrilldownInfo();
  const { probeSuccess } = timeseries;

  const probesWithResults = Object.entries(probeSuccess);
  const allProbesRunning = probesWithResults.length === check.probes.length;
  const hasResults = probesWithResults.length > 0;

  return {
    probes: check.probes,
    hasResults,
    allProbesRunning,
    probesWithResults,
  };
}
