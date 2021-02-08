import { Alert, Button, HorizontalGroup, Modal, Spinner } from '@grafana/ui';
import React, { FC, useContext, useState } from 'react';
import { InstanceContext } from './InstanceContext';

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
};

export const DisablePluginModal: FC<Props> = ({ isOpen, onDismiss }) => {
  const { instance, loading } = useContext(InstanceContext);
  const [error, setError] = useState();

  const disableTenant = async () => {
    try {
      await instance.api?.disableTenant();
    } catch (e) {
      setError(e.message ?? 'Something went wrong trying to disable the plugin. Please contact support.');
    }
  };

  return (
    <Modal title="Disable synthetic monitoring" isOpen={isOpen} onDismiss={onDismiss}>
      <p>Are you sure? Disabling the plugin will also disable all your checks.</p>
      {loading ? (
        <Spinner />
      ) : (
        <HorizontalGroup>
          <Button variant="destructive" onClick={disableTenant}>
            Disable
          </Button>
          <Button variant="secondary" onClick={onDismiss}>
            Cancel
          </Button>
        </HorizontalGroup>
      )}
      {error && <Alert title="Disable failed">{error}</Alert>}
    </Modal>
  );
};
