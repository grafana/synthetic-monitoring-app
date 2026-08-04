import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

export function formatLatency(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }
  return `${seconds.toFixed(2)} s`;
}

/**
 * Link to a check's dashboard carrying the folder page's time window, so the
 * user lands on the same 3h view they were just looking at.
 */
export function getCheckDashboardHrefForRange(check: Check, range: { from: number; to: number }): string {
  const path = generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! });
  return `${path}?from=${range.from}&to=${range.to}`;
}
