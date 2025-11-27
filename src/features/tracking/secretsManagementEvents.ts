import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const secretsManagementEvents = createSMEventFactory('secrets_management');

interface CreateSecretButtonClicked extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: 'check_editor_sidepanel_feature_tabs' | 'config_page_secrets_tab';
  /** The location where the create button was clicked. */
  location: 'empty_state' | 'header_action';
}

/** Tracks when the create secret button is clicked. */
export const trackCreateSecretButtonClicked =
  secretsManagementEvents<CreateSecretButtonClicked>('create_secret_button_clicked');

interface EditSecretButtonClicked extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: 'check_editor_sidepanel_feature_tabs' | 'config_page_secrets_tab';
  /** The name of the secret being edited. */
  secretName: string;
}

/** Tracks when the edit secret button is clicked. */
export const trackEditSecretButtonClicked =
  secretsManagementEvents<EditSecretButtonClicked>('edit_secret_button_clicked');

interface DeleteSecretButtonClicked extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: 'check_editor_sidepanel_feature_tabs' | 'config_page_secrets_tab';
  /** The name of the secret being deleted. */
  secretName: string;
}

/** Tracks when the delete secret button is clicked. */
export const trackDeleteSecretButtonClicked =
  secretsManagementEvents<DeleteSecretButtonClicked>('delete_secret_button_clicked');

interface SecretCreated extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: 'check_editor_sidepanel_feature_tabs' | 'config_page_secrets_tab';
  /** The name of the secret that was created. */
  secretName: string;
}

/** Tracks when a secret is successfully created. */
export const trackSecretCreated = secretsManagementEvents<SecretCreated>('secret_created');

interface SecretUpdated extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: 'check_editor_sidepanel_feature_tabs' | 'config_page_secrets_tab';
  /** The name of the secret that was updated. */
  secretName: string;
}

/** Tracks when a secret is successfully updated. */
export const trackSecretUpdated = secretsManagementEvents<SecretUpdated>('secret_updated');

interface SecretDeleted extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: 'check_editor_sidepanel_feature_tabs' | 'config_page_secrets_tab';
  /** The name of the secret that was deleted. */
  secretName: string;
}

/** Tracks when a secret is successfully deleted. */
export const trackSecretDeleted = secretsManagementEvents<SecretDeleted>('secret_deleted');
