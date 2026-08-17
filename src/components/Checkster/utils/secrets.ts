/**
 * Helpers for the `${secrets.<name>}` reference syntax used to point a check's
 * credential fields at a secret stored in Grafana Secrets Manager. The agent
 * resolves these references at check-execution time; the frontend only needs to
 * write, detect, and parse them. Mirror of the agent-side interpolation regex
 * (`internal/prober/interpolation`).
 */
export const SECRET_REF_REGEX = /\$\{secrets\.([^}]*)\}/;

/**
 * Whether a field value is a secret reference (e.g. `${secrets.my-token}`).
 */
export function isSecretRef(value?: string): boolean {
  return typeof value === 'string' && SECRET_REF_REGEX.test(value);
}

/**
 * Extract the secret name from a reference, or `undefined` if the value is not
 * a reference.
 */
export function parseSecretName(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.match(SECRET_REF_REGEX);
  return match ? match[1] : undefined;
}

/**
 * Build a secret reference from a secret name.
 */
export function buildSecretRef(name: string): string {
  return `\${secrets.${name}}`;
}
