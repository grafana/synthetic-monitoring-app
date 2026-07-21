import type { ScenarioManifest } from './scenarioManifest';

export interface HttpDashboardManifest extends ScenarioManifest {
  schema_version: 1;
  scenario: 'http-dashboard-parity';
  dsl_version: 1;
  start: string;
  end: string;
  aggregate: ScenarioManifest['aggregate'] & {
    latency_mean_ms: number;
    ssl_earliest_cert_expiry: number;
  };
}

const requiredManifestMessage = 'http-dashboard-parity manifest required';
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function requireHttpDashboardManifest(manifest: ScenarioManifest): HttpDashboardManifest {
  if (!hasHttpDashboardIdentity(manifest) || !hasDashboardFacts(manifest)) {
    throw new Error(requiredManifestMessage);
  }

  return manifest as HttpDashboardManifest;
}

export function getDashboardTimeRange(
  manifest: HttpDashboardManifest,
  paddingExecutions = 1
): { from: string; to: string } {
  if (!Number.isInteger(paddingExecutions) || paddingExecutions < 0) {
    throw new Error('Dashboard time range padding must be a non-negative integer');
  }

  const paddingMs = manifest.frequency_ms * paddingExecutions;
  return {
    from: new Date(Date.parse(manifest.start) - paddingMs).toISOString(),
    to: new Date(Date.parse(manifest.end) + paddingMs).toISOString(),
  };
}

export function getExpectedTimepointCount(manifest: HttpDashboardManifest): number {
  return Math.max(...Object.values(manifest.probes).map((probe) => probe.executions));
}

export function formatGrafanaUtcInput(value: string | number): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('Invalid Grafana UTC input');
  }

  return timestamp
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '');
}

function hasHttpDashboardIdentity(manifest: ScenarioManifest): boolean {
  return (
    manifest.schema_version === 1 &&
    manifest.scenario === 'http-dashboard-parity' &&
    manifest.dsl_version === 1 &&
    isIsoTimestamp(manifest.start) &&
    isIsoTimestamp(manifest.end) &&
    Date.parse(manifest.start) < Date.parse(manifest.end) &&
    isPositiveFiniteNumber(manifest.frequency_ms)
  );
}

function hasDashboardFacts(manifest: ScenarioManifest): boolean {
  const probes = isRecord(manifest.probes) ? Object.values(manifest.probes) : [];
  const aggregate = manifest.aggregate;

  return (
    probes.length >= 3 &&
    isRecord(aggregate) &&
    isPositiveInteger(aggregate.executions) &&
    isUnitInterval(aggregate.reachability) &&
    isUnitInterval(aggregate.uptime) &&
    isNonNegativeFiniteNumber(aggregate.latency_mean_ms) &&
    isPositiveFiniteNumber(aggregate.ssl_earliest_cert_expiry) &&
    probes.every(hasProbeFacts) &&
    probes.some((probe) => isRecord(probe) && hasFailureEvidence(probe.status_counts))
  );
}

function hasProbeFacts(probe: unknown): boolean {
  if (!isRecord(probe) || !isRecord(probe.status_counts)) {
    return false;
  }

  const statusCounts = Object.values(probe.status_counts);
  return (
    isPositiveInteger(probe.executions) &&
    isNonNegativeFiniteNumber(probe.offset_s) &&
    isUnitInterval(probe.reachability) &&
    isNonNegativeFiniteNumber(probe.latency_p50_ms) &&
    isNonNegativeFiniteNumber(probe.latency_p95_ms) &&
    statusCounts.every(isNonNegativeFiniteNumber) &&
    statusCounts.reduce((sum, count) => sum + count, 0) === probe.executions
  );
}

function hasFailureEvidence(statusCounts: Record<string, unknown>): boolean {
  return Object.entries(statusCounts).some(
    ([status, count]) => isPositiveFiniteNumber(count) && (status.startsWith('failure:') || /^[45]\d\d$/.test(status))
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !isoTimestampPattern.test(value) || Number.isNaN(Date.parse(value))) {
    return false;
  }

  const [date] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isUnitInterval(value: unknown): value is number {
  return isNonNegativeFiniteNumber(value) && value <= 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
