import { getLocationSrv } from '@grafana/runtime';
import { Button, Spinner } from '@grafana/ui';
import React, { FC, useContext, useState } from 'react';
import { DisablePluginModal } from './DisablePluginModal';
import { InstanceContext } from './InstanceContext';

const handleSetup = () => {
  getLocationSrv().update({
    partial: false,
    path: 'a/grafana-synthetic-monitoring-app/?page=setup',
    query: {
      page: 'setup',
    },
  });
};

export const ConfigActions: FC = () => {
  const { instance, loading } = useContext(InstanceContext);
  const [showDisableModal, setShowDisableModal] = useState(false);

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
    return (
      <Button variant="primary" onClick={handleSetup}>
        Setup
      </Button>
    );
  };

  return (
    <>
      {getAction()}
      <DisablePluginModal isOpen={showDisableModal} onDismiss={() => setShowDisableModal(false)} />
    </>
  );
};
