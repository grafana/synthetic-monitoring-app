import React, { useContext, useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Button, HorizontalGroup, Modal } from '@grafana/ui';

import { FaroEvent, reportEvent } from 'faro';
import { InstanceContext } from 'contexts/InstanceContext';

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
  pluginId: string;
};

export const DisablePluginModal = ({ isOpen, onDismiss, pluginId }: Props) => {
  const { instance } = useContext(InstanceContext);
  const [error, setError] = useState<string | undefined>();

  const disableTenant = async () => {
    try {
      reportEvent(FaroEvent.DISABLE_PLUGIN);
      await instance.api?.disableTenant();
      await getBackendSrv()
        .fetch({
          url: `/api/plugins/${pluginId}/settings`,
          method: 'POST',
          headers: { 'X-Grafana-NoCache': 'true' },
          data: {
            enabled: false,
          },
        })
        .toPromise();
      window.location.reload();
    } catch (e) {
      const err = e as Error;
      reportError(e);
      setError(err.message ?? 'Something went wrong trying to disable the plugin. Please contact support.');
    }
  };

  return (
    <Modal title="Disable synthetic monitoring" isOpen={isOpen} onDismiss={onDismiss}>
      <p>Are you sure? Disabling the plugin will also disable all your checks.</p>

      <HorizontalGroup>
        <Button variant="destructive" onClick={disableTenant}>
          Disable
        </Button>
        <Button variant="secondary" onClick={onDismiss}>
          Cancel
        </Button>
      </HorizontalGroup>

      {error && <Alert title="Disable failed">{error}</Alert>}
    </Modal>
  );
};
