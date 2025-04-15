interface Label {
  name: string;
  value: string;
}

export interface Secret {
  name: string;
  description: string;
  labels: Label[];
  plaintext: never; // Never returned by the API
}

export interface SecretWithValue extends Omit<Secret, 'plaintext'> {
  plaintext: string; // Created in client
}

export interface SecretMetadata {
  created_at: number;
  modified_at: number;
  created_by: string;
  org_id: number;
  stack_id: number;
  uuid: string;
}

export interface SecretWithMetadata extends Secret, SecretMetadata {}
