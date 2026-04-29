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
  uuid: string;
  created_at: number;
  created_by: string;
  /**
   * List of services allowed to decrypt this secret. Only the capability
   * list is ever returned by the API, never the raw value. SM only shows
   * and operates on secrets whose decrypters include `synthetic-monitoring`.
   */
  decrypters: string[];
}

export interface SecretWithUuid extends Omit<Secret, 'uuid'> {
  uuid: string;
}

export interface SecretWithMetadata extends SecretWithUuid, SecretMetadata {}

/** The source context where the secrets management UI is being used. */
export type SecretsManagementSource = 'check_editor_sidepanel_feature_tabs' | 'config_page_secrets_tab';
