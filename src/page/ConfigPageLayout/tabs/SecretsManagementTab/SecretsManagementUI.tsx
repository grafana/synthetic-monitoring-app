import React, { useState } from 'react';
import { Button, ConfirmModal, EmptyState } from '@grafana/ui';
import { css } from '@emotion/css';

import { SecretWithUuid } from './types';
import { useDeleteSecret, useSecrets } from 'data/useSecrets';
import { CenteredSpinner } from 'components/CenteredSpinner';

import { ConfigContent } from '../../ConfigContent';
import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretCard } from './SecretCard';
import { SecretEditModal } from './SecretEditModal';

export function SecretsManagementUI() {
  const [editMode, setEditMode] = useState<string | false>(false);
  const [deleteMode, setDeleteMode] = useState<SecretWithUuid | undefined>();
  const { data: secrets, isLoading, isFetching } = useSecrets();
  const deleteSecret = useDeleteSecret();
  const emptyState = secrets?.length === 0;

  const handleAddSecret = () => {
    setEditMode(SECRETS_EDIT_MODE_ADD);
  };

  const handleEditSecret = (id?: string) => {
    setEditMode(id ?? false);
  };

  const handleDeleteSecret = (id: string) => {
    const secret = secrets?.find((s) => s.uuid === id);
    if (secret) {
      setDeleteMode(secret);
    }
  };

  if (isLoading) {
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
              <Button onClick={handleAddSecret} icon="plus">
                Create secret
              </Button>
            }
          >
            You can use secrets to store private information such as passwords, API keys, and other sensitive data.
          </EmptyState>
        </ConfigContent>
      ) : (
        <ConfigContent
          title="Secrets management"
          actions={
            <div>
              <Button size="sm" icon="plus" onClick={handleAddSecret}>
                Create secret
              </Button>
            </div>
          }
        >
          <div>
            <p>
              Secrets is a way to store and manage secrets in Grafana Cloud. You can use secrets to store private
              information such as passwords, API keys, and other sensitive data.
            </p>
          </div>
          <ConfigContent.Section>
            {secrets?.map((secret) => (
              <SecretCard key={secret.uuid} secret={secret} onEdit={handleEditSecret} onDelete={handleDeleteSecret} />
            ))}
          </ConfigContent.Section>
        </ConfigContent>
      )}

      {editMode && <SecretEditModal id={editMode} open onDismiss={() => handleEditSecret()} />}

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
          deleteMode && deleteSecret.mutate(deleteMode.uuid);
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
