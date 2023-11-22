import React, { useCallback, useState } from 'react';
import { Alert, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { type Probe, ROUTES } from 'types';
import { type AddProbeResult } from 'datasource/responses.types';
import { useCreateProbe } from 'data/useProbes';
import { useNavigation } from 'hooks/useNavigation';
import { BackendAddress } from 'components/BackendAddress';
import { DocsLink } from 'components/DocsLink';
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

export const NewProbe = () => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState(``);
  const probe = { ...TEMPLATE_PROBE };
  const navigate = useNavigation();

  const onCreateSuccess = useCallback((res: AddProbeResult) => {
    setShowTokenModal(true);
    setProbeToken(res.token);
  }, []);

  const { mutate: createProbe, error } = useCreateProbe({ onSuccess: onCreateSuccess });

  const handleSubmit = (formValues: Probe) => {
    createProbe({
      ...probe,
      ...formValues,
    });
  };

  const errorInfo = error
    ? {
        title: 'Failed to create probe',
        message: error.message,
      }
    : undefined;

  return (
    <PluginPage pageNav={{ text: `New private probe` }}>
      <ProbeEditor
        errorInfo={errorInfo}
        onSubmit={handleSubmit}
        probe={probe}
        submitText="Add new probe"
        supportingContent={<SettingUpAProbe />}
      />
      <ProbeTokenModal
        isOpen={showTokenModal}
        actionText="Go back to probes list"
        onDismiss={() => {
          navigate(ROUTES.Probes);
          setShowTokenModal(false);
        }}
        token={probeToken}
      />
    </PluginPage>
  );
};

const SettingUpAProbe = () => {
  const theme = useTheme2();

  return (
    <div>
      <BackendAddress omitHttp />
      <DocsLink article="addPrivateProbe" className={css({ marginBottom: theme.spacing(2) })}>
        Learn how to run a private probe
      </DocsLink>
      <Alert severity="info" title="Note">
        You must reconfigure any existing checks to use your new probe even if you selected all probes when initially
        creating the check.
      </Alert>
    </div>
  );
};
