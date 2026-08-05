/**
 * Derives the reliability-inbox endpoint for a stack's region.
 */

/**
 * Grafana Cloud domain → environment prefix used in cluster names.
 *
 * Checked in order; grafana.net is last because it is the shortest suffix.
 */
const ENVIRONMENT_BY_DOMAIN: ReadonlyArray<readonly [suffix: string, environment: string]> = [
  ['.grafana-dev.net', 'dev'],
  ['.grafana-ops.net', 'ops'],
  ['.grafana.net', 'prod'],
];

/**
 * Environments where k6-experiments is actually deployed.
 *
 * The derivation above works for prod too, but advertising the feature on a stack
 * whose region has no instance would surface a broken button. Add 'prod' here in
 * the same change that deploys the prod clusters.
 */
const DEPLOYED_ENVIRONMENTS: readonly string[] = ['dev', 'ops'];

const SM_API_PREFIX = 'synthetic-monitoring-api';

/**
 * SM's legacy region-suffix overrides, reversed: SM's region label → the region
 * part of the real cluster name.
 *
 * Mirrors hostnameRegionOverrides in deployment_tools. Keyed by environment because
 * the same label can mean different things (an empty suffix is prod-us-central-0;
 * 'dev' is dev-us-central-0).
 */
const EXCEPTIONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  dev: {
    dev: 'us-central-0', // synthetic-monitoring-api-dev  → dev-us-central-0
  },
  prod: {
    '': 'us-central-0', // synthetic-monitoring-api       → prod-us-central-0
    'au-southeast': 'au-southeast-0', // drops the trailing -0
    'eu-west': 'eu-west-0',
    'gb-south': 'gb-south-0',
  },
};

/**
 * Extracts the hostname from an apiHost value.
 *
 * `apiHost` is stored with a scheme (`https://host`), but tolerate a bare host, a
 * trailing slash and a port rather than failing on formatting.
 */
function hostnameOf(apiHost: string): string | undefined {
  const trimmed = apiHost?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname;
  } catch {
    return undefined;
  }
}

/**
 * The hostname of the reliability-inbox instance co-located with this stack's SM
 * API, or `undefined` when the host is not a recognised SM API or its environment
 * has no deployment.
 */
function instanceHost(apiHost: string): string | undefined {
  const hostname = hostnameOf(apiHost)?.toLowerCase();
  if (!hostname) {
    return undefined;
  }

  const match = ENVIRONMENT_BY_DOMAIN.find(([suffix]) => hostname.endsWith(suffix));
  if (!match) {
    return undefined;
  }

  const [, environment] = match;
  if (!DEPLOYED_ENVIRONMENTS.includes(environment)) {
    return undefined;
  }

  // Split off the first label: 'synthetic-monitoring-api[-<region>]' and the rest,
  // which may itself contain a regional subdomain.
  const firstDot = hostname.indexOf('.');
  if (firstDot < 0) {
    return undefined;
  }

  const label = hostname.slice(0, firstDot);
  const rest = hostname.slice(firstDot + 1);

  if (!label.startsWith(SM_API_PREFIX)) {
    return undefined;
  }

  // '' for a bare prefix, otherwise the region with its leading '-' removed.
  const smRegion = label.slice(SM_API_PREFIX.length).replace(/^-/, '');
  const region = EXCEPTIONS[environment]?.[smRegion] ?? smRegion;

  // A bare prefix with no exception would produce 'k6-experiments-<env>-.' —
  // refuse rather than emit a nonsense host.
  if (!region) {
    return undefined;
  }

  return `k6-experiments-${environment}-${region}.${rest}`;
}

/**
 * The suggestions endpoint for this stack's region, or `undefined` when no instance
 * serves it. Callers must treat `undefined` as "feature unavailable": failing closed
 * keeps a stack's token from being sent somewhere unexpected.
 *
 * Called directly by the browser rather than through the datasource proxy, because
 * a proxy route cannot exist until it ships in a released plugin version — Grafana
 * registers routes server-side from the *installed* plugin. The service permits
 * Grafana dev and ops origins via CORS for exactly this.
 */
export function reliabilityInboxURL(apiHost: string): string | undefined {
  const host = instanceHost(apiHost);

  return host ? `https://${host}/api/v1alpha1/reliability-inbox/suggestions` : undefined;
}
