import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
import { PluginPage } from '@grafana/runtime';
import { LinkButton, TextLink } from '@grafana/ui';

import { ExtendedProbe, type Probe, type ProbePageParams } from 'types';
import { ROUTES } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { useExtendedProbe, useUpdateProbe } from 'data/useProbes';
import { useCanEditProbe } from 'hooks/useCanEditProbe';
import { useNavigation } from 'hooks/useNavigation';
import { DeleteProbeButton } from 'components/DeleteProbeButton';
import { ProbeEditor } from 'components/ProbeEditor';
import { ProbeStatus } from 'components/ProbeStatus';
import { ProbeTokenModal } from 'components/ProbeTokenModal';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { PluginPageNotFound } from '../NotFound/NotFound';
import { getErrorInfo, getTitle } from './EditProbe.utils';

export const EditProbe = ({ forceViewMode }: { forceViewMode?: boolean }) => {
  const [probe, setProbe] = useState<ExtendedProbe>();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const { canWriteProbes } = useCanEditProbe(probe);

  useEffect(() => {
    // This is mainly here to handle legacy links redirect
    if (probe && !canWriteProbes && !forceViewMode) {
      navigate(generateRoutePath(ROUTES.ViewProbe, { id: probe.id! }), { replace: true });
    }
  }, [canWriteProbes, navigate, probe, forceViewMode]);
  if (errorMessage) {
    return (
      <PluginPageNotFound breadcrumb="Probe not found">
        Unable to find the probe you are looking for. Try the{' '}
        <TextLink href={getRoute(ROUTES.Probes)}>probe listing</TextLink> page.
      </PluginPageNotFound>
    );
  }

  return (
    <PluginPage
      pageNav={{ text: getTitle(probe, canWriteProbes && !forceViewMode) }}
      actions={
        canWriteProbes &&
        probe &&
        forceViewMode && (
          <LinkButton variant="secondary" icon="pen" href={generateRoutePath(ROUTES.EditProbe, { id: probe.id! })}>
            Edit probe
          </LinkButton>
        )
      }
    >
      <QueryErrorBoundary>
        <EditProbeFetch forceViewMode={forceViewMode} onProbeFetch={setProbe} onError={setErrorMessage} />
      </QueryErrorBoundary>
    </PluginPage>
  );
};

const EditProbeFetch = ({
  onProbeFetch,
  forceViewMode,
  onError,
}: {
  forceViewMode?: boolean;
  onProbeFetch: (probe: ExtendedProbe) => void;
  onError?: (message: string) => void;
}) => {
  const { id } = useParams<ProbePageParams>();
  const [probe, isLoading] = useExtendedProbe(Number(id));
  const navigate = useNavigation();

  useEffect(() => {
    if (probe) {
      onProbeFetch(probe);
    }
    if (!isLoading && !probe) {
      onError && onError('Probe not found');
    }
  }, [isLoading, navigate, onError, onProbeFetch, probe]);

  if (!probe) {
    return null;
  }

  return <EditProbeContent forceViewMode={forceViewMode} probe={probe} />;
};

const EditProbeContent = ({ probe, forceViewMode }: { forceViewMode?: boolean; probe: ExtendedProbe }) => {
  const navigate = useNavigation();
  const { canDeleteProbes } = useCanEditProbe(probe);
  const writeMode = canDeleteProbes && !forceViewMode;
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [probeToken, setProbeToken] = useState(``);

  const onUpdateSuccess = useCallback(() => {
    navigate(ROUTES.Probes);
  }, [navigate]);

  const { mutate: onUpdate, error: updateError } = useUpdateProbe({ onSuccess: onUpdateSuccess });

  const handleSubmit = useCallback(
    (formValues: Probe) => {
      const { checks, ...probeEntity } = probe;

      return onUpdate({
        ...probeEntity,
        ...formValues,
      });
    },
    [onUpdate, probe]
  );

  const errorInfo = getErrorInfo(updateError);

  const handleOnDeleteSuccess = useCallback(() => {
    navigate(ROUTES.Probes);
  }, [navigate]);

  const actions = useMemo(
    () => (writeMode ? <DeleteProbeButton probe={probe} onDeleteSuccess={handleOnDeleteSuccess} /> : null),
    [writeMode, handleOnDeleteSuccess, probe]
  );

  const onReset = useCallback((token: string) => {
    setShowTokenModal(true);
    setProbeToken(token);
  }, []);

  return (
    <>
      <ProbeEditor
        actions={actions}
        errorInfo={errorInfo}
        onSubmit={handleSubmit}
        probe={probe}
        submitText="Update probe"
        forceViewMode={forceViewMode}
        supportingContent={<ProbeStatus probe={probe} onReset={onReset} readOnly={forceViewMode} />}
      />
      <ProbeTokenModal
        actionText="Close"
        isOpen={showTokenModal}
        onDismiss={() => setShowTokenModal(false)}
        token={probeToken}
      />
    </>
  );
};
