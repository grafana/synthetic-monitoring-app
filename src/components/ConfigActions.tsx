import React, { useContext, useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Spinner } from '@grafana/ui';

import { ROUTES } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';

import { DisablePluginModal } from './DisablePluginModal';

interface Props {
  enabled?: boolean;
  pluginId: string;
}

export const ConfigActions = ({ enabled, pluginId }: Props) => {
  const { instance, loading } = useContext(InstanceContext);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const navigate = useNavigation();

  const handleEnable = async () => {
    await getBackendSrv()
      .fetch({
        url: `/api/plugins/${pluginId}/settings`,
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

  const getAction = () => {
    if (loading) {
      return <Spinner />;
    }

    if (instance?.api) {
      return (
        <Button variant="destructive" onClick={() => setShowDisableModal(true)}>
          Disable synthetic monitoring
        </Button>
      );
    }

    if (!enabled) {
      return (
        <Button variant="primary" onClick={handleEnable}>
          Enable plugin
        </Button>
      );
    }

    return (
      <Button variant="primary" onClick={handleSetup}>
        Setup
      </Button>
    );
  };

  return (
    <>
      {getAction()}
      <DisablePluginModal isOpen={showDisableModal} onDismiss={() => setShowDisableModal(false)} pluginId={pluginId} />
    </>
  );
};
