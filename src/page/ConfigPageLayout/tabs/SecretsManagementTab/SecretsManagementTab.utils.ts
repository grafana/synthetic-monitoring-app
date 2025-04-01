import { ExperimentalSecret } from 'data/useSecrets';

export type SecretFormValues = Omit<
  ExperimentalSecret,
  'uuid' | 'created_by' | 'created_at' | 'modified_at' | 'org_id' | 'stack_id'
> & { uuid?: string };

export function secretToFormValues(secret?: ExperimentalSecret): SecretFormValues | undefined {
  if (!secret) {
    return;
  }

  return {
    uuid: secret.uuid,
    name: secret.name,
    description: secret.description,
    labels: secret.labels,
  };
}
