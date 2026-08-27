import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CheckRuntimeAlertStates, getCheckCompositeKey, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

import { FolderCheckMetrics } from './FolderDashboard.hooks';
import { FolderExecutionLogs } from './FolderSwimlane.hooks';

/** Stable identity for React keys and row ids, tolerating checks without an id. */
export function getCheckKey(check: Check): string {
  return String(check.id ?? `${check.job}-${check.target}`);
}

const DAYS_PER_MONTH = 31;

export function getExecutionsPerMonth(checks: Check[]): number {
  return checks.reduce((total, check) => {
    // Disabled checks don't execute, so they contribute no volume.
    if (!check.frequency || !check.enabled) {
      return total;
    }
    const perProbe = (DAYS_PER_MONTH * 24 * 60 * 60 * 1000) / check.frequency;
    return total + Math.round(perProbe * check.probes.length);
  }, 0);
}

export function formatPercent(fraction: number): string {
  const percent = fraction * 100;
  // Never round an imperfect value up to 100% — a check that failed recently
  // showing "100.0%" next to a Down state reads as a contradiction.
  if (percent > 99.9 && percent < 100) {
    return '99.9%';
  }
  return `${percent.toFixed(1)}%`;
}

export function formatLatency(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }
  return `${seconds.toFixed(2)} s`;
}

enum AttentionTier {
  Down = 0,
  Alerting = 1,
  RecentFailures = 2,
  Healthy = 3,
}

/**
 * Order checks by how much attention they need, so the page reads top-down as
 * a ranked story even in large folders: currently-down checks (most recent
 * failure first), then firing alerts (most alerts first), then checks with
 * failures in the window (most failures first, then most recent), then
 * healthy checks alphabetically.
 */
export function orderChecksByAttention(
  checks: Check[],
  metrics: FolderCheckMetrics,
  alertStates: CheckRuntimeAlertStates | undefined,
  executionLogs: FolderExecutionLogs
): Check[] {
  const failureStats = new Map<string, { count: number; lastTimestamp: number }>();
  executionLogs.failures.forEach((failure) => {
    const key = getCheckCompositeKey(failure.job, failure.instance);
    const existing = failureStats.get(key);
    failureStats.set(key, {
      count: (existing?.count ?? 0) + 1,
      lastTimestamp: Math.max(existing?.lastTimestamp ?? 0, failure.timestamp),
    });
  });

  const rank = (check: Check) => {
    const key = getCheckCompositeKey(check.job, check.target);
    const failures = failureStats.get(key);
    const firingCount = alertStates ? getCheckRuntimeAlertState(alertStates, check).firingCount : 0;

    let tier = AttentionTier.Healthy;
    if (metrics.getSummary(check).isUp === false) {
      tier = AttentionTier.Down;
    } else if (firingCount > 0) {
      tier = AttentionTier.Alerting;
    } else if (failures) {
      tier = AttentionTier.RecentFailures;
    }

    return {
      tier,
      firingCount,
      failureCount: failures?.count ?? 0,
      lastFailure: failures?.lastTimestamp ?? 0,
    };
  };

  return [...checks].sort((a, b) => {
    const rankA = rank(a);
    const rankB = rank(b);

    return (
      rankA.tier - rankB.tier ||
      rankB.firingCount - rankA.firingCount ||
      rankB.failureCount - rankA.failureCount ||
      rankB.lastFailure - rankA.lastFailure ||
      a.job.localeCompare(b.job)
    );
  });
}

/**
 * Link to a check's dashboard with a relative "last 3 hours" range matching
 * the folder page's window — relative so the target page shows a live
 * selector instead of a frozen absolute window.
 */
export function getCheckDashboardHref(check: Check): string {
  const path = generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! });
  return `${path}?from=now-${DEFAULT_QUERY_FROM_TIME}&to=now`;
}
