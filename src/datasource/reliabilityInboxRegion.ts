/**
 * Region resolution for the experimental reliability-inbox service.
 */

/** SM API hostname → the hostname of the co-located reliability-inbox instance. */
const HOST_BY_SM_API_HOST: Readonly<Record<string, string>> = {
  'synthetic-monitoring-api-eu-west-2.grafana-dev.net': 'k6-experiments-dev-eu-west-2.grafana-dev.net',
  'synthetic-monitoring-api-eu-west-6.gcp-europe-west10-0.grafana-dev.net':
    'k6-experiments-dev-eu-west-6.gcp-europe-west10-0.grafana-dev.net',
  'synthetic-monitoring-api-dev.grafana-dev.net': 'k6-experiments-dev-us-central-0.grafana-dev.net',
  'synthetic-monitoring-api-us-east-0.grafana-dev.net': 'k6-experiments-dev-us-east-0.grafana-dev.net',
  'synthetic-monitoring-api-us-east-3.dev-us-east-3.grafana-dev.net':
    'k6-experiments-dev-us-east-3.dev-us-east-3.grafana-dev.net',
};

/**
 * Extracts the hostname from an apiHost value.
 *
 * `apiHost` is stored with a scheme (`https://host`), but tolerate a bare host, a
 * trailing slash and a port rather than failing the lookup on formatting.
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
 * The suggestions endpoint for this stack's region, or `undefined` when no
 * instance serves it.
 *
 * Called directly by the browser rather than through the datasource proxy,
 * because a proxy route cannot exist until it ships in a released plugin version:
 * Grafana registers routes server-side from the *installed* plugin, so a locally
 * grafted build cannot add one. The service permits Grafana dev and ops stack
 * origins via CORS for exactly this. Since the request bypasses the proxy, the
 * caller must supply the Synthetic Monitoring token itself.
 */
export function reliabilityInboxURL(apiHost: string): string | undefined {
  const hostname = hostnameOf(apiHost);
  const host = hostname ? HOST_BY_SM_API_HOST[hostname] : undefined;

  return host ? `https://${host}/api/v1alpha1/reliability-inbox/suggestions` : undefined;
}
