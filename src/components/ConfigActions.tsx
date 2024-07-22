import React, { useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { Button } from '@grafana/ui';

import { ROUTES } from 'types';
import { useMeta } from 'hooks/useMeta';
import { useNavigation } from 'hooks/useNavigation';

import { DisablePluginModal } from './DisablePluginModal';

export const ConfigActions = ({ initialized }: { initialized?: boolean }) => {
  const [showDisableModal, setShowDisableModal] = useState(false);
  const navigate = useNavigation();
  const meta = useMeta();

  const handleEnable = async () => {
    await getBackendSrv()
      .fetch({
        url: `/api/plugins/${meta.id}/settings`,
        method: 'POST',
        data: {
          enabled: true,
          pinned: true,
        },
      })
      .toPromise();
    window.location.reload();
  };

  const handleSetup = () => {
    navigate(ROUTES.Home);
  };

  if (!meta.enabled) {
    return (
      <Button variant="primary" onClick={handleEnable}>
        Enable plugin
      </Button>
    );
  }

  if (initialized) {
    return (
      <>
        <Button variant="destructive" onClick={() => setShowDisableModal(true)}>
          Disable synthetic monitoring
        </Button>
        <DisablePluginModal isOpen={showDisableModal} onDismiss={() => setShowDisableModal(false)} />
      </>
    );
  }

  return (
    <Button variant="primary" onClick={handleSetup}>
      Setup
    </Button>
  );
};
