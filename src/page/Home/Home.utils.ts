import { CheckHealth, CheckHealthStatus, ComputeCheckHealthOptions, HomeKpis } from './Home.types';
import { Check } from 'types';
import { getCheckType } from 'utils';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';

const EMPTY_ALERT_NAMES = new Set<string>();

function toMetricMap(metrics: ComputeCheckHealthOptions['currentSuccessRates']): Map<string, number> {
  const map = new Map<string, number>();

  metrics?.forEach(({ metric, value }) => {
    const parsed = Number(value[1]);

    // Prometheus returns NaN for 0/0 divisions (e.g. a check that produced no samples in the window)
    if (Number.isFinite(parsed)) {
      map.set(getCheckCompositeKey(metric.job, metric.instance), parsed);
    }
  });

  return map;
}

export function computeCheckHealth({
  checks,
  currentSuccessRates,
  reachabilityRates,
  alertStates,
  reachabilityThreshold,
}: ComputeCheckHealthOptions): CheckHealth[] {
  const currentMap = toMetricMap(currentSuccessRates);
  const reachabilityMap = toMetricMap(reachabilityRates);

  return checks
    .filter((check) => check.enabled)
    .map((check) => {
      const key = getCheckCompositeKey(check.job, check.target);
      const recentSuccessRate = currentMap.get(key) ?? null;
      const reachability = reachabilityMap.get(key) ?? null;
      const alertState = alertStates?.[key];
      const firingCount = alertState?.firingCount ?? 0;
      const firingAlertNames = alertState?.firingAlertNames ?? EMPTY_ALERT_NAMES;

      return {
        check,
        status: getStatus({ recentSuccessRate, reachability, firingCount, reachabilityThreshold }),
        recentSuccessRate,
        reachability,
        firingCount,
        firingAlertNames,
      };
    });
}

interface GetStatusOptions {
  recentSuccessRate: number | null;
  reachability: number | null;
  firingCount: number;
  reachabilityThreshold?: ComputeCheckHealthOptions['reachabilityThreshold'];
}

function getStatus({ recentSuccessRate, reachability, firingCount, reachabilityThreshold }: GetStatusOptions) {
  if (recentSuccessRate === 0) {
    return CheckHealthStatus.Down;
  }

  if (firingCount > 0) {
    return CheckHealthStatus.Firing;
  }

  if (recentSuccessRate === null && reachability === null) {
    return CheckHealthStatus.NoData;
  }

  if (recentSuccessRate !== null && recentSuccessRate < 1) {
    return CheckHealthStatus.Degraded;
  }

  // thresholds are configured on a percentage scale (0-100), metrics are ratios (0-1)
  if (reachabilityThreshold && reachability !== null && reachability * 100 <= reachabilityThreshold.upperLimit) {
    return CheckHealthStatus.Degraded;
  }

  return CheckHealthStatus.Healthy;
}

export function sortBySeverity(a: CheckHealth, b: CheckHealth): number {
  if (a.status !== b.status) {
    return a.status - b.status;
  }

  if (a.status === CheckHealthStatus.Firing && a.firingCount !== b.firingCount) {
    return b.firingCount - a.firingCount;
  }

  if (a.status === CheckHealthStatus.Down || a.status === CheckHealthStatus.Degraded) {
    const aReach = a.reachability ?? Infinity;
    const bReach = b.reachability ?? Infinity;

    if (aReach !== bReach) {
      return aReach - bReach;
    }
  }

  return a.check.job.localeCompare(b.check.job) || a.check.target.localeCompare(b.check.target);
}

export function summarizeKpis(checkHealth: CheckHealth[], checks: Check[]): HomeKpis {
  const counts = checkHealth.reduce(
    (acc, { status, firingCount }) => {
      acc.firingAlertsCount += firingCount;

      switch (status) {
        case CheckHealthStatus.Down:
          acc.downCount += 1;
          break;
        case CheckHealthStatus.Firing:
          acc.firingChecks += 1;
          break;
        case CheckHealthStatus.Degraded:
          acc.degradedCount += 1;
          break;
        case CheckHealthStatus.NoData:
          acc.noDataCount += 1;
          break;
        case CheckHealthStatus.Healthy:
          acc.healthyCount += 1;
          break;
      }

      return acc;
    },
    { downCount: 0, firingChecks: 0, degradedCount: 0, noDataCount: 0, healthyCount: 0, firingAlertsCount: 0 }
  );

  return {
    totalChecks: checks.length,
    disabledChecks: checks.filter((check) => !check.enabled).length,
    downCount: counts.downCount,
    firingAlertsCount: counts.firingAlertsCount,
    degradedCount: counts.degradedCount,
    noDataCount: counts.noDataCount,
    healthyCount: counts.healthyCount,
  };
}

export function matchesFilters(checkHealth: CheckHealth, searchTerm: string, checkTypes: string[]): boolean {
  if (checkTypes.length > 0 && !checkTypes.includes(getCheckType(checkHealth.check.settings))) {
    return false;
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();

    return (
      checkHealth.check.job.toLowerCase().includes(term) || checkHealth.check.target.toLowerCase().includes(term)
    );
  }

  return true;
}
