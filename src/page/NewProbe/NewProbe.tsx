import React, { useState } from 'react';
import { css } from '@emotion/css';

import { type Probe, ROUTES } from 'types';
import { type CreateProbeResult, useCreateProbe } from 'data/useProbes';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';
import { ProbeEditor } from 'components/ProbeEditor';
import { ProbeTokenModal } from 'components/ProbeTokenModal';

export const TEMPLATE_PROBE: Probe = {
  name: '',
  public: false,
  latitude: 0.0,
  longitude: 0.0,
  region: '',
  labels: [],
  online: false,
  onlineChange: 0,
  version: 'unknown',
  deprecated: false,
};

type NewProbeProps = {
  refetchProbes: () => void;
};

export const NewProbe = ({ refetchProbes }: NewProbeProps) => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState(``);
  const { onCreate, error } = useCreateProbe();
  const probe = { ...TEMPLATE_PROBE };
  const navigate = useNavigation();

  const onCreateSuccess = (res: CreateProbeResult) => {
    setShowTokenModal(true);
    setProbeToken(res.token);
    refetchProbes();
  };

  const handleSubmit = (formValues: Probe) => {
    onCreate(
      {
        ...probe,
        ...formValues,
      },
      onCreateSuccess
    );
  };

  const errorInfo = error
    ? {
        title: 'Failed to create probe',
        message: error.message,
      }
    : undefined;

  return (
    <PluginPage pageNav={{ text: `New private probe` }}>
      <div className={css({ display: `flex` })}>
        <ProbeEditor errorInfo={errorInfo} onSubmit={handleSubmit} probe={probe} submitText="Add new probe" />
      </div>
      <ProbeTokenModal
        isOpen={showTokenModal}
        onDismiss={() => {
          navigate(ROUTES.Probes);
          setShowTokenModal(false);
        }}
        token={probeToken}
      />
    </PluginPage>
  );
};
