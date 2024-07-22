import React, { useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Button, Modal, Stack } from '@grafana/ui';

import { FaroEvent, reportEvent } from 'faro';
import { useMeta } from 'hooks/useMeta';
import { useSMDS } from 'hooks/useSMDS';

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
};

export const DisablePluginModal = ({ isOpen, onDismiss }: Props) => {
  const smDS = useSMDS();
  const meta = useMeta();
  const [error, setError] = useState<string | undefined>();

  const disableTenant = async () => {
    try {
      reportEvent(FaroEvent.DISABLE_PLUGIN);
      await smDS.disableTenant();
      await getBackendSrv()
        .fetch({
          url: `/api/plugins/${meta.id}/settings`,
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

      <Stack>
        <Button variant="destructive" onClick={disableTenant}>
          Disable
        </Button>
        <Button variant="secondary" onClick={onDismiss}>
          Cancel
        </Button>
      </Stack>

      {error && <Alert title="Disable failed">{error}</Alert>}
    </Modal>
  );
};
