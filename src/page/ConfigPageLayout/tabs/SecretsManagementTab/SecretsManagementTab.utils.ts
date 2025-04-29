import { Secret, SecretWithMetadata } from './types';

export type SecretFormValues = Omit<Secret, 'plaintext'> & { plaintext?: string };

export function secretToFormValues(secret?: SecretWithMetadata): SecretFormValues | undefined {
  if (!secret) {
    return undefined;
  }

  return {
    uuid: secret.uuid,
    name: secret.name,
    description: secret.description,
    labels: secret.labels,
  };
}
