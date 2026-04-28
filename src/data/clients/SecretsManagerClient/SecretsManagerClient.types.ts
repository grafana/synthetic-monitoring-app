/**
 * Annotation keys set by the secrets management API on resource metadata.
 *
 * Only annotations that SM surfaces to users are listed here; others
 * (e.g. `grafana.app/updatedBy`, `grafana.app/updatedTimestamp`) exist on
 * the API response but aren't consumed by SM today.
 */
export const SECRET_ANNOTATIONS = {
  createdBy: 'grafana.app/createdBy',
} as const;

/**
 * Shape of a single secure value resource returned by the Grafana secrets API.
 * The API follows Kubernetes resource conventions with `metadata`, `spec`, and
 * `status` sections. The raw secret value is never returned on reads.
 */
export interface SecretResponseItem {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
    creationTimestamp: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    description: string;
    decrypters?: string[];
  };
  status?: {
    externalID?: string;
    version?: number;
  };
}

/**
 * Shape of the list response from `GET .../securevalues`.
 */
export interface SecretsListResponse {
  apiVersion: string;
  kind: string;
  metadata: Record<string, unknown>;
  items: SecretResponseItem[];
}

/**
 * Payload for `POST .../securevalues` (create).
 *
 * `spec.decrypters` must be set by SM to `[SM_SECRET_DECRYPTER]` so the
 * new secret is visible and usable by Synthetic Monitoring.
 */
export interface CreateSecretParam {
  metadata: {
    name: string;
    labels?: Record<string, string>;
  };
  spec: {
    description: string;
    decrypters: string[];
    value: string;
  };
}

/**
 * Payload for `PUT .../securevalues/{name}` (update).
 *
 * `decrypters` is echoed back from the existing resource so SM preserves the
 * user-managed decrypter list instead of clearing it. `value` is only sent
 * when the user is resetting the secret.
 */
export interface UpdateSecretParam {
  metadata: {
    name: string;
    labels?: Record<string, string>;
  };
  spec: {
    description: string;
    decrypters: string[];
    value?: string;
  };
}
