interface Label {
  name: string;
  value: string;
}

export interface Secret {
  uuid?: string;
  name: string;
  description: string;
  labels: Label[];
  plaintext?: never; // Never returned by the API
}

export interface SecretWithValue extends Omit<Secret, 'plaintext'> {
  plaintext: string; // Created in the client
}

export interface SecretMetadata {
  created_at: number;
  modified_at: number;
  created_by: string;
  org_id: number;
  stack_id: number;
  uuid: string;
}

export interface SecretWithUuid extends Omit<Secret, 'uuid'> {
  uuid: string;
}

export interface SecretWithMetadata extends SecretWithUuid, SecretMetadata {}
