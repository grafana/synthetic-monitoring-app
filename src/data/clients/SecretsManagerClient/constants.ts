/**
 * Decrypter identifier used by Synthetic Monitoring in Grafana's secrets
 * management API. Secrets that include this decrypter are visible to SM
 * and can be referenced by SM checks.
 */
export const SM_SECRET_DECRYPTER = 'synthetic-monitoring';

/**
 * Base path for the Grafana secrets management API.
 * Full list URL: `${SECRETS_API_BASE}/namespaces/stacks-{stackId}/securevalues`.
 */
export const SECRETS_API_BASE = '/apis/secret.grafana.app/v1beta1';
