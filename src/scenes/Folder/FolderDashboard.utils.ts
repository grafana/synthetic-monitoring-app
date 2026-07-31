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

const EXECUTION_LINK_WINDOW_MS = 30 * 60 * 1000;

/**
 * Link to a check's dashboard with the time range centred on a specific
 * execution — the closest thing to deep-linking an execution until the
 * dashboard supports it directly.
 */
export function getCheckDashboardHrefAtTime(check: Check, timestamp: number): string {
  const path = generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! });
  return `${path}?from=${timestamp - EXECUTION_LINK_WINDOW_MS}&to=${timestamp + EXECUTION_LINK_WINDOW_MS}`;
}
