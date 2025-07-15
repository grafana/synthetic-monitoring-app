import React, { useCallback, useState } from 'react';
import { PluginPage } from '@grafana/runtime';
import { Alert, Stack } from '@grafana/ui';

import { ExtendedProbe, type Probe, ProbeProvider } from 'types';
import { AppRoutes } from 'routing/types';
import { type AddProbeResult } from 'datasource/responses.types';
import { useCreateProbe } from 'data/useProbes';
import { useNavigation } from 'hooks/useNavigation';
import { ProbeAPIServer } from 'components/ProbeAPIServer';
import { ProbeEditor } from 'components/ProbeEditor';
import { ProbeSetupModal } from 'components/ProbeSetupModal';

export const TEMPLATE_PROBE: ExtendedProbe = {
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
  capabilities: {
    disableScriptedChecks: false,
    disableBrowserChecks: false,
  },
  provider: ProbeProvider.AWS,
  country: '',
  countryCode: '',
  longRegion: '',
  displayName: '',
  checks: [],
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
        supportingContent={<SupportingContent />}
      />
      <ProbeSetupModal
        isOpen={showTokenModal}
        actionText="Go back to probes list"
        onDismiss={() => {
          navigate(AppRoutes.Probes);
          setShowTokenModal(false);
        }}
        token={probeToken}
      />
    </PluginPage>
  );
};

const SupportingContent = () => {
  return (
    <Stack direction="column" gap={2}>
      <ProbeAPIServer />
      <Alert severity="info" title="Note">
        You must reconfigure any existing checks to use your new probe even if you selected all probes when initially
        creating the check.
      </Alert>
    </Stack>
  );
};
