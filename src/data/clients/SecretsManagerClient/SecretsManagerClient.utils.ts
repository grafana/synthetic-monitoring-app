import { CreateSecretParam, SECRET_ANNOTATIONS, SecretResponseItem, UpdateSecretParam } from './SecretsManagerClient.types';
import { SecretWithMetadata } from 'page/ConfigPageLayout/tabs/SecretsManagementTab';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

import { SM_SECRET_DECRYPTER } from './constants';

function labelsRecordToArray(labels?: Record<string, string>): Array<{ name: string; value: string }> {
  return Object.entries(labels ?? {}).map(([name, value]) => ({ name, value }));
}

function labelsArrayToRecord(labels?: Array<{ name: string; value: string }>): Record<string, string> | undefined {
  if (!labels || labels.length === 0) {
    return undefined;
  }
  return labels.reduce<Record<string, string>>((acc, { name, value }) => {
    if (name) {
      acc[name] = value;
    }
    return acc;
  }, {});
}

/**
 * Normalizes a Kubernetes-style secret resource from the Grafana secrets API
 * into the SecretWithMetadata shape the rest of the app expects.
 */
export function normalizeSecret(item: SecretResponseItem): SecretWithMetadata {
  const annotations = item.metadata.annotations ?? {};
  const createdAtRaw = Date.parse(item.metadata.creationTimestamp);

  return {
    uuid: item.metadata.uid,
    name: item.metadata.name,
    description: item.spec.description,
    labels: labelsRecordToArray(item.metadata.labels),
    decrypters: item.spec.decrypters ?? [],
    created_at: Number.isNaN(createdAtRaw) ? 0 : createdAtRaw,
    created_by: annotations[SECRET_ANNOTATIONS.createdBy] ?? '',
  };
}

/**
 * Form values for creating a new secret.
 *
 * Narrows {@link SecretFormValues} to guarantee a `plaintext` value at
 * compile time, since the API requires it on create.
 */
export type CreateSecretFormValues = SecretFormValues & { plaintext: string };

/**
 * Builds the create payload for the Grafana secrets API from the form values
 * used by SM's SecretEditModal.
 *
 * Always injects `synthetic-monitoring` as a decrypter so newly created
 * secrets are usable by SM checks.
 */
export function formValuesToCreatePayload(values: CreateSecretFormValues): CreateSecretParam {
  const labels = labelsArrayToRecord(values.labels);

  return {
    metadata: {
      name: values.name,
      ...(labels ? { labels } : {}),
    },
    spec: {
      description: values.description,
      decrypters: [SM_SECRET_DECRYPTER],
      value: values.plaintext,
    },
  };
}

/**
 * Builds the update payload for the Grafana secrets API from the form values
 * used by SM's SecretEditModal.
 *
 * `decrypters` is echoed back from the existing resource so SM preserves the
 * user-managed decrypter list (the API treats missing decrypters as a reset).
 * `value` is only sent when the user reset the value. Labels are always sent
 * (including as an empty record) so removing all labels takes effect.
 */
export function formValuesToUpdatePayload(
  values: SecretFormValues,
  currentDecrypters: string[]
): UpdateSecretParam {
  return {
    metadata: {
      name: values.name,
      labels: labelsArrayToRecord(values.labels) ?? {},
    },
    spec: {
      description: values.description,
      decrypters: currentDecrypters,
      ...(values.plaintext !== undefined ? { value: values.plaintext } : {}),
    },
  };
}
