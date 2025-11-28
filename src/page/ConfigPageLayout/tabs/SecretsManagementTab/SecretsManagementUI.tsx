import React, { useState } from 'react';
import { Button, ConfirmModal, EmptyState } from '@grafana/ui';
import { css } from '@emotion/css';
import {
  trackCreateSecretButtonClicked,
  trackDeleteSecretButtonClicked,
  trackEditSecretButtonClicked,
  trackSecretDeleted,
} from 'features/tracking/secretsManagementEvents';

import { SecretsManagementSource, SecretWithUuid } from './types';
import { getUserPermissions } from 'data/permissions';
import { useDeleteSecret, useSecrets } from 'data/useSecrets';
import { CenteredSpinner } from 'components/CenteredSpinner';

import { ConfigContent } from '../../ConfigContent';
import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretCard } from './SecretCard';
import { SecretEditModal } from './SecretEditModal';

interface SecretsManagementUIProps {
  /** The source context where the secrets management UI is being used. */
  source: SecretsManagementSource;
}

export function SecretsManagementUI({ source }: SecretsManagementUIProps) {
  const [editMode, setEditMode] = useState<string | false>(false);
  const [deleteMode, setDeleteMode] = useState<SecretWithUuid | undefined>();
  const { canCreateSecrets, canReadSecrets } = getUserPermissions();
  const { data: secrets, isLoading, isFetching } = useSecrets(canReadSecrets);
  const deleteSecret = useDeleteSecret();
  const emptyState = (canReadSecrets && secrets?.length === 0) || (!canReadSecrets && canCreateSecrets);

  const existingNames = secrets?.map((secret) => secret.name) ?? [];

  const handleAddSecret = (location: 'empty_state' | 'header_action') => {
    trackCreateSecretButtonClicked({ source, location });
    setEditMode(SECRETS_EDIT_MODE_ADD);
  };

  const handleEditSecret = (name?: string) => {
    if (name) {
      trackEditSecretButtonClicked({ source });
    }
    setEditMode(name ?? false);
  };

  const handleDeleteSecret = (name: string) => {
    trackDeleteSecretButtonClicked({ source });
    const secret = secrets?.find((s) => s.name === name);
    if (secret) {
      setDeleteMode(secret);
    }
  };

  if (isLoading && canReadSecrets) {
    return <ConfigContent loading ariaLoadingLabel="Loading secrets" />;
  }

  return (
    <>
      {emptyState ? (
        <ConfigContent>
          <EmptyState
            variant="call-to-action"
            message="You don't have any secrets yet."
            button={
              canCreateSecrets ? (
                <Button onClick={() => handleAddSecret('empty_state')} icon="plus">
                  Create secret
                </Button>
              ) : undefined
            }
          >
            You can use secrets to store private information such as passwords, API keys, and other sensitive data.
            {!canCreateSecrets && (
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d' }}>
                Contact an admin to create secrets.
              </div>
            )}
          </EmptyState>
        </ConfigContent>
      ) : (
        <ConfigContent
          title="Secrets management"
          actions={
            canCreateSecrets ? (
              <div>
                <Button size="sm" icon="plus" onClick={() => handleAddSecret('header_action')}>
                  Create secret
                </Button>
              </div>
            ) : undefined
          }
        >
          <div>
            <p>
              Secrets is a way to store and manage secrets in Grafana Cloud. You can use secrets to store private
              information such as passwords, API keys, and other sensitive data.
            </p>
          </div>
          {canReadSecrets && (
            <ConfigContent.Section>
              {secrets?.map((secret) => (
                <SecretCard key={secret.uuid} secret={secret} onEdit={handleEditSecret} onDelete={handleDeleteSecret} />
              ))}
            </ConfigContent.Section>
          )}
        </ConfigContent>
      )}

      {editMode && (
        <SecretEditModal
          name={editMode}
          existingNames={existingNames}
          open
          source={source}
          onDismiss={() => handleEditSecret()}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteMode}
        title="Delete secret"
        body={
          <div>
            Are you sure you want to delete <code>{deleteMode?.name}</code>?
          </div>
        }
        confirmText="Delete"
        confirmationText="Delete"
        description={
          <div>
            Deleting a secret is irreversible and will remove the secret from Grafana Cloud. Any references to this
            secret will be broken.
          </div>
        }
        onConfirm={() => {
          if (deleteMode) {
            deleteSecret.mutate(deleteMode.name, {
              onSuccess: () => {
                trackSecretDeleted({ source });
              },
            });
          }
          setDeleteMode(undefined);
        }}
        onDismiss={() => setDeleteMode(undefined)}
      />
      {(isFetching || deleteSecret.isPending) && (
        <div
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
          `}
        >
          <CenteredSpinner />
        </div>
      )}
    </>
  );
}
