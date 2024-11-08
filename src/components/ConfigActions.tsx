import React, { useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { Button, LinkButton } from '@grafana/ui';

import { ROUTES } from 'types';
import { useMeta } from 'hooks/useMeta';
import { usePluginPermissions } from 'hooks/usePluginPermissions';

import { DisablePluginModal } from './DisablePluginModal';
import { getRoute } from './Routing.utils';

export const ConfigActions = ({ initialized }: { initialized?: boolean }) => {
  const [showDisableModal, setShowDisableModal] = useState(false);
  const meta = useMeta();

  const { canEnablePlugin, canDisablePlugin, canEditPlugin } = usePluginPermissions();

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

  if (!canEditPlugin) {
    return null;
  }

  if (!meta.enabled && canEnablePlugin) {
    return (
      <Button variant="primary" onClick={handleEnable}>
        Enable plugin
      </Button>
    );
  }

  if (initialized && canDisablePlugin) {
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
    <LinkButton variant="primary" href={getRoute(ROUTES.Home)}>
      Setup
    </LinkButton>
  );
};
