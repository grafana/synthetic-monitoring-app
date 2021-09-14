import { getBackendSrv, getLocationSrv } from '@grafana/runtime';
import { Button, Spinner } from '@grafana/ui';
import React, { useContext, useState } from 'react';
import { DisablePluginModal } from './DisablePluginModal';
import { InstanceContext } from 'contexts/InstanceContext';

interface Props {
  enabled?: boolean;
  pluginId: string;
}

export const ConfigActions = ({ enabled, pluginId }: Props) => {
  const { instance, loading } = useContext(InstanceContext);
  const [showDisableModal, setShowDisableModal] = useState(false);

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
    getLocationSrv().update({
      replace: true,
      path: '/a/grafana-synthetic-monitoring-app/?page=setup',
      query: {
        page: 'setup',
      },
    });
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
