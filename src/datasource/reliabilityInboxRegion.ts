const DEPLOYED_DOMAINS = [
  ['.grafana-dev.net', 'dev'],
  ['.grafana-ops.net', 'ops'],
] as const;

const SM_API_PREFIX = 'synthetic-monitoring-api-';
const SUGGESTIONS_PATH = '/api/v1alpha1/reliability-inbox/suggestions';

/** Returns the co-located experimental service URL, failing closed elsewhere. */
export function reliabilityInboxURL(apiHost: string): string | undefined {
  const trimmed = apiHost?.trim();
  if (!trimmed) {
    return undefined;
  }

  let hostname: string;
  try {
    hostname = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  const deployment = DEPLOYED_DOMAINS.find(([suffix]) => hostname.endsWith(suffix));
  const [label, ...domain] = hostname.split('.');
  if (!deployment || !label.startsWith(SM_API_PREFIX) || domain.length === 0) {
    return undefined;
  }

  const [, environment] = deployment;
  const smRegion = label.slice(SM_API_PREFIX.length);
  const region = environment === 'dev' && smRegion === 'dev' ? 'us-central-0' : smRegion;
  if (!region) {
    return undefined;
  }

  return `https://k6-experiments-${environment}-${region}.${domain.join('.')}${SUGGESTIONS_PATH}`;
}
