import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CheckRuntimeAlertStates, getCheckCompositeKey, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';

import { FolderCheckMetrics } from './FolderDashboard.hooks';
import { FolderExecutionLogs } from './FolderSwimlane.hooks';

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
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
 * Link to a check's dashboard carrying the folder page's time window, so the
 * user lands on the same 3h view they were just looking at.
 */
export function getCheckDashboardHrefForRange(check: Check, range: { from: number; to: number }): string {
  const path = generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! });
  return `${path}?from=${range.from}&to=${range.to}`;
}
