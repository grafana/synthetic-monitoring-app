import { PLUGIN_URL_PATH } from 'routing/constants';
import type { InsightsCheckMeta } from 'datasource/responses.types';

export const CHECKS_URL = `${PLUGIN_URL_PATH}checks`;
export const PERF_PAGE_SIZE = 7;

export function getCheckLabel(checkId: string | number, checks: Record<string, InsightsCheckMeta>): string {
  const meta = checks[String(checkId)];
  return meta?.job ?? `Check #${checkId}`;
}

export function getCheckDashboardUrl(checkId: string | number): string {
  return `${PLUGIN_URL_PATH}checks/${checkId}`;
}

export function formatAlertName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^ /, '')
    .replace('T L S', 'TLS')
    .replace('H T T P', 'HTTP')
    .replace('D N S', 'DNS')
    .trim();
}

export function formatAlertThreshold(name: string, threshold: number): string {
  if (name.includes('CertificateCloseToExpiring')) {
    return `${threshold} days`;
  }
  if (name.includes('Duration')) {
    return `${threshold}ms`;
  }
  return `${threshold}`;
}
