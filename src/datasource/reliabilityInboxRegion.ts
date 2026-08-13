const DEPLOYED_DOMAINS = [
  ['.grafana-dev.net', 'dev'],
  ['.grafana-ops.net', 'ops'],
] as const;

const SM_API_PREFIX = 'synthetic-monitoring-api-';
const SUGGESTIONS_PATH = '/api/v1alpha1/reliability-inbox/suggestions';

/** Hostnames used by dem-dev and other local SM stacks (see dem-dev SM datasource provisioning). */
const LOCAL_SM_API_HOSTNAMES = new Set(['localhost', '127.0.0.1', 'sm-api']);

const DEFAULT_LOCAL_SUGGESTIONS_ORIGIN = 'http://localhost:10001';

/** Returns the co-located experimental service URL, failing closed elsewhere. */
export function reliabilityInboxURL(apiHost: string): string | undefined {
  const trimmed = apiHost?.trim();
  if (!trimmed) {
    return undefined;
  }

  const local = localReliabilityInboxURL(trimmed);
  if (local) {
    return local;
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

/** True when suggestions are served from a local k6-experiments instance (dem-dev loop). */
export function isLocalReliabilityInboxStack(apiHost: string): boolean {
  const url = reliabilityInboxURL(apiHost);
  return url?.startsWith(`${DEFAULT_LOCAL_SUGGESTIONS_ORIGIN}/`) ?? false;
}

function localReliabilityInboxURL(apiHost: string): string | undefined {
  let hostname: string;
  try {
    hostname = new URL(apiHost.includes('://') ? apiHost : `http://${apiHost}`).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  if (!LOCAL_SM_API_HOSTNAMES.has(hostname)) {
    return undefined;
  }

  return `${DEFAULT_LOCAL_SUGGESTIONS_ORIGIN}${SUGGESTIONS_PATH}`;
}
