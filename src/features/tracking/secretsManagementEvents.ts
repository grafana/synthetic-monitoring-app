import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { SecretsManagementSource } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/types';

const secretsManagementEvents = createSMEventFactory('secrets_management');

interface CreateSecretButtonClicked extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: SecretsManagementSource;
  /** The location where the create button was clicked. */
  location: 'empty_state' | 'header_action';
}

/** Tracks when the create secret button is clicked. */
export const trackCreateSecretButtonClicked =
  secretsManagementEvents<CreateSecretButtonClicked>('create_secret_button_clicked');

interface SecretsManagementEvent extends TrackingEventProps {
  /** The source context where the secrets management UI is being used. */
  source: SecretsManagementSource;
}

/** Tracks when the edit secret button is clicked. */
export const trackEditSecretButtonClicked =
  secretsManagementEvents<SecretsManagementEvent>('edit_secret_button_clicked');

/** Tracks when the delete secret button is clicked. */
export const trackDeleteSecretButtonClicked =
  secretsManagementEvents<SecretsManagementEvent>('delete_secret_button_clicked');

/** Tracks when a secret is successfully created. */
export const trackSecretCreated = secretsManagementEvents<SecretsManagementEvent>('secret_created');

/** Tracks when a secret is successfully updated. */
export const trackSecretUpdated = secretsManagementEvents<SecretsManagementEvent>('secret_updated');

/** Tracks when a secret is successfully deleted. */
export const trackSecretDeleted = secretsManagementEvents<SecretsManagementEvent>('secret_deleted');
