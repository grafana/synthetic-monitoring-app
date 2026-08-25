const DEPLOYED_DOMAINS = [
  ['.grafana-dev.net', 'dev'],
  ['.grafana-ops.net', 'ops'],
  ['.grafana.net', 'prod'],
] as const;

const SM_API_LABEL = 'synthetic-monitoring-api';
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
  const isRegionalHost = label.startsWith(`${SM_API_LABEL}-`);
  if (!deployment || (label !== SM_API_LABEL && !isRegionalHost) || domain.length === 0) {
    return undefined;
  }

  const [, environment] = deployment;
  const smRegion = isRegionalHost ? label.slice(SM_API_LABEL.length + 1) : '';
  let region = smRegion;

  if (environment === 'dev' && region === 'dev') {
    region = 'us-central-0';
  }

  if (environment === 'prod') {
    const prodRegionAliases: Record<string, string> = {
      '': 'us-central-0',
      'au-southeast': 'au-southeast-0',
      'eu-west': 'eu-west-0',
      'gb-south': 'gb-south-0',
    };
    region = prodRegionAliases[region] ?? region;
  }

  if (!region) {
    return undefined;
  }

  return `https://k6-experiments-${environment}-${region}.${domain.join('.')}${SUGGESTIONS_PATH}`;
}
