import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
import { PluginPage } from '@grafana/runtime';
import { LinkButton } from '@grafana/ui';
import { generateRoutePath } from 'routes/utils';

import { ExtendedProbe, type Probe, type ProbePageParams, ROUTES } from 'types';
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

export const EditProbe = ({ readOnly }: { readOnly?: boolean }) => {
  const [probe, setProbe] = useState<ExtendedProbe>();
  const navigate = useNavigate();
  const canEdit = useCanEditProbe(probe);

  useEffect(() => {
    // This is mainly here to handle legacy links redirect
    if (probe && !canEdit && !readOnly) {
      navigate(generateRoutePath(ROUTES.ViewProbe, { id: probe.id! }), { replace: true });
    }
  }, [canEdit, navigate, probe, readOnly]);

  return (
    <PluginPage
      pageNav={{ text: getTitle(probe, canEdit && !readOnly) }}
      actions={
        canEdit &&
        probe &&
        readOnly && (
          <LinkButton variant="secondary" icon="pen" href={generateRoutePath(ROUTES.EditProbe, { id: probe.id! })}>
            Edit probe
          </LinkButton>
        )
      }
    >
      <QueryErrorBoundary>
        <EditProbeFetch readOnly={readOnly} onProbeFetch={setProbe} />
      </QueryErrorBoundary>
    </PluginPage>
  );
};

const EditProbeFetch = ({
  onProbeFetch,
  readOnly,
}: {
  readOnly?: boolean;
  onProbeFetch: (probe: ExtendedProbe) => void;
}) => {
  const { id } = useParams<ProbePageParams>();
  const [probe, isLoading] = useExtendedProbe(Number(id));
  const navigate = useNavigation();

  useEffect(() => {
    if (probe) {
      onProbeFetch(probe);
    }
  }, [isLoading, navigate, onProbeFetch, probe]);

  if (!probe) {
    if (!isLoading) {
      return <PluginPageNotFound />;
    }
    return null;
  }

  return <EditProbeContent readOnly={readOnly} probe={probe} />;
};

const EditProbeContent = ({ probe, readOnly }: { readOnly?: boolean; probe: ExtendedProbe }) => {
  const navigate = useNavigation();
  const canEdit = useCanEditProbe(probe);
  const writeMode = canEdit && !readOnly;
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
        readOnly={readOnly}
        supportingContent={<ProbeStatus probe={probe} onReset={onReset} readOnly={readOnly} />}
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
